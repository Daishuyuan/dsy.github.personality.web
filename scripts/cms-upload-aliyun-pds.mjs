#!/usr/bin/env node
import { createHash, randomBytes, scrypt as scryptCallback } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, posix, resolve } from "node:path";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const DEFAULT_REMOTE_DIR = "/dsy-blog-cms-backups";
const DEFAULT_CHUNK_SIZE = 16 * 1024 * 1024;
const ENCRYPTION_MAGIC = "dsy-blog-cms-backup-aes-256-gcm/v1";

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printHelp();
  process.exit(0);
}

async function main() {
  const source = args.source ? resolve(args.source) : "";
  if (!source) {
    throw new Error("Usage: npm run cms:upload-aliyun-pds -- --source <backup.tar.gz> [--verify-download]");
  }

  const config = readAliyunPdsConfig();
  const sourceBytes = await readFile(source);
  const sourceName = args.remoteName ?? basename(source);
  const sourceHash = sha256(sourceBytes);
  const prepared = await prepareUploadPayload({
    bytes: sourceBytes,
    sourceName,
    sourceHash,
    requireEncryption: args.requireEncryption === true,
    passphrase: config.encryptionPassphrase
  });

  if (args.dryRun) {
    console.log(JSON.stringify(toDryRunReport(config, prepared), null, 2));
    return;
  }

  const client = new AliyunPdsClient(config);
  const token = await client.refreshAccessToken();
  const driveId = config.driveId || token.default_drive_id;
  if (!driveId) {
    throw new Error("ALIYUN_PDS_DRIVE_ID is not configured and token response did not include default_drive_id.");
  }

  const parentFileId = await client.ensureDirectory({
    driveId,
    rootParentFileId: config.parentFileId,
    remoteDir: args.remoteDir ?? config.remoteDir
  });
  const uploaded = await client.uploadFile({
    driveId,
    parentFileId,
    name: prepared.name,
    contentType: prepared.contentType,
    bytes: prepared.bytes,
    chunkSize: config.chunkSize
  });

  let downloadVerified = false;
  if (args.verifyDownload) {
    await client.verifyDownload({
      driveId,
      fileId: uploaded.file_id,
      expectedHash: prepared.hash
    });
    downloadVerified = true;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        provider: "aliyun-pds",
        endpoint: config.endpoint,
        domainId: config.domainId,
        driveId,
        remoteDir: args.remoteDir ?? config.remoteDir,
        file: {
          fileId: uploaded.file_id,
          name: uploaded.name ?? prepared.name,
          sizeBytes: prepared.bytes.byteLength,
          hash: prepared.hash,
          encrypted: prepared.encrypted,
          sourceName,
          sourceHash
        },
        downloadVerified,
        refreshedTokenReturned: Boolean(token.refresh_token)
      },
      null,
      2
    )
  );
}

class AliyunPdsClient {
  #accessToken = "";

  constructor(config) {
    this.config = config;
  }

  async refreshAccessToken() {
    const body = new URLSearchParams({
      domain_id: this.config.domainId,
      grant_type: "refresh_token",
      client_id: this.config.clientId,
      refresh_token: this.config.refreshToken
    });
    if (this.config.clientSecret) {
      body.set("client_secret", this.config.clientSecret);
    }
    const token = await this.fetchJson("/v2/oauth/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body
    });
    if (!token.access_token) {
      throw new Error("Aliyun PDS token response did not include access_token.");
    }
    this.#accessToken = token.access_token;
    return token;
  }

  async ensureDirectory({ driveId, rootParentFileId, remoteDir }) {
    const segments = normalizeRemoteDir(remoteDir);
    let parentFileId = rootParentFileId || "root";
    for (const segment of segments) {
      const existing = await this.findChild({
        driveId,
        parentFileId,
        name: segment,
        type: "folder"
      });
      if (existing) {
        parentFileId = existing.file_id;
        continue;
      }
      const created = await this.createFile({
        drive_id: driveId,
        parent_file_id: parentFileId,
        name: segment,
        type: "folder",
        check_name_mode: "refuse"
      });
      parentFileId = created.file_id;
    }
    return parentFileId;
  }

  async uploadFile({ driveId, parentFileId, name, contentType, bytes, chunkSize }) {
    const partCount = Math.max(1, Math.ceil(bytes.byteLength / chunkSize));
    const createPayload = {
      drive_id: driveId,
      parent_file_id: parentFileId,
      name,
      type: "file",
      size: bytes.byteLength,
      content_type: contentType,
      content_hash: sha1(bytes).toUpperCase(),
      content_hash_name: "sha1",
      check_name_mode: "auto_rename",
      part_info_list: Array.from({ length: partCount }, (_, index) => ({
        part_number: index + 1
      }))
    };
    const file = await this.createFile(createPayload);
    if (file.rapid_upload) {
      return file;
    }
    const uploadId = file.upload_id;
    if (!uploadId || !Array.isArray(file.part_info_list)) {
      throw new Error("Aliyun PDS create file response did not include upload_id or part_info_list.");
    }

    for (const part of file.part_info_list.sort((left, right) => left.part_number - right.part_number)) {
      const start = (part.part_number - 1) * chunkSize;
      const end = Math.min(start + chunkSize, bytes.byteLength);
      const chunk = bytes.subarray(start, end);
      await this.putUploadUrl(part.upload_url, chunk);
    }

    return this.fetchJson("/v2/file/complete", {
      method: "POST",
      body: JSON.stringify({
        drive_id: driveId,
        file_id: file.file_id,
        upload_id: uploadId
      })
    });
  }

  async verifyDownload({ driveId, fileId, expectedHash }) {
    const download = await this.fetchJson("/v2/file/get_download_url", {
      method: "POST",
      body: JSON.stringify({
        drive_id: driveId,
        file_id: fileId,
        expire_sec: 900
      })
    });
    if (!download.url) {
      throw new Error("Aliyun PDS get_download_url response did not include url.");
    }
    const response = await fetchWithTimeout(download.url, { timeoutMs: 60_000 });
    if (!response.ok) {
      throw new Error(`Aliyun PDS download verification failed with HTTP ${response.status}.`);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    const actualHash = sha256(bytes);
    if (actualHash !== expectedHash) {
      throw new Error(`Aliyun PDS download hash mismatch: expected ${expectedHash}, got ${actualHash}.`);
    }
  }

  async findChild({ driveId, parentFileId, name, type }) {
    let marker = "";
    while (true) {
      const result = await this.fetchJson("/v2/file/list", {
        method: "POST",
        body: JSON.stringify({
          drive_id: driveId,
          parent_file_id: parentFileId,
          limit: 100,
          marker,
          type,
          order_by: "name",
          order_direction: "ASC"
        })
      });
      const match = (result.items ?? []).find((item) => item.name === name && item.type === type);
      if (match) {
        return match;
      }
      marker = result.next_marker ?? "";
      if (!marker) {
        return null;
      }
    }
  }

  async createFile(payload) {
    return this.fetchJson("/v2/file/create", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async putUploadUrl(url, bytes) {
    const response = await fetchWithTimeout(url, {
      method: "PUT",
      headers: { "content-length": String(bytes.byteLength) },
      body: bytes,
      timeoutMs: 120_000
    });
    if (!response.ok) {
      throw new Error(`Aliyun PDS part upload failed with HTTP ${response.status}: ${await response.text()}`);
    }
  }

  async fetchJson(path, init = {}) {
    const headers = {
      accept: "application/json",
      ...(init.body instanceof URLSearchParams ? {} : { "content-type": "application/json" }),
      ...(this.#accessToken ? { authorization: `Bearer ${this.#accessToken}` } : {}),
      ...(init.headers ?? {})
    };
    const response = await fetchWithTimeout(`${this.config.endpoint}${path}`, {
      ...init,
      headers,
      timeoutMs: this.config.timeoutMs
    });
    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};
    if (!response.ok) {
      const message = payload.message ?? payload.code ?? text;
      throw new Error(`Aliyun PDS ${path} failed with HTTP ${response.status}: ${message}`);
    }
    return payload;
  }
}

async function prepareUploadPayload({ bytes, sourceName, sourceHash, requireEncryption, passphrase }) {
  if (!passphrase) {
    if (requireEncryption) {
      throw new Error("ALIYUN_PDS_ENCRYPTION_PASSPHRASE is required when --require-encryption is set.");
    }
    return {
      bytes,
      name: sourceName,
      hash: sha256(bytes),
      contentType: "application/gzip",
      encrypted: false
    };
  }

  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await scrypt(passphrase, salt, 32);
  const cipher = await import("node:crypto").then(({ createCipheriv }) => createCipheriv("aes-256-gcm", key, iv));
  const ciphertext = Buffer.concat([cipher.update(bytes), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const header = Buffer.from(
    `${JSON.stringify({
      magic: ENCRYPTION_MAGIC,
      kdf: "scrypt",
      cipher: "aes-256-gcm",
      salt: salt.toString("base64"),
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
      sourceName,
      sourceHash,
      createdAt: new Date().toISOString()
    })}\n`,
    "utf8"
  );
  const encryptedBytes = Buffer.concat([header, ciphertext]);
  return {
    bytes: encryptedBytes,
    name: `${sourceName}.enc`,
    hash: sha256(encryptedBytes),
    contentType: "application/octet-stream",
    encrypted: true
  };
}

async function fetchWithTimeout(url, { timeoutMs, ...init }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function readAliyunPdsConfig() {
  const domainId = readRequiredEnv("ALIYUN_PDS_DOMAIN_ID");
  const endpoint = stripTrailingSlash(process.env.ALIYUN_PDS_ENDPOINT ?? `https://${domainId}.api.aliyunpds.com`);
  return {
    domainId,
    endpoint,
    clientId: readRequiredEnv("ALIYUN_PDS_CLIENT_ID"),
    clientSecret: readOptionalEnv("ALIYUN_PDS_CLIENT_SECRET"),
    refreshToken: readRequiredEnv("ALIYUN_PDS_REFRESH_TOKEN"),
    driveId: readOptionalEnv("ALIYUN_PDS_DRIVE_ID"),
    parentFileId: readOptionalEnv("ALIYUN_PDS_PARENT_FILE_ID") ?? "root",
    remoteDir: readOptionalEnv("ALIYUN_PDS_REMOTE_DIR") ?? DEFAULT_REMOTE_DIR,
    encryptionPassphrase: readOptionalEnv("ALIYUN_PDS_ENCRYPTION_PASSPHRASE"),
    chunkSize: readPositiveInteger("ALIYUN_PDS_CHUNK_SIZE_BYTES", DEFAULT_CHUNK_SIZE),
    timeoutMs: readPositiveInteger("ALIYUN_PDS_TIMEOUT_MS", 30_000)
  };
}

function readRequiredEnv(name) {
  const value = readOptionalEnv(name);
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

function readOptionalEnv(name) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

function readPositiveInteger(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function normalizeRemoteDir(value) {
  const normalized = posix.normalize(`/${String(value ?? "")}`);
  if (normalized === "/" || normalized === ".") {
    return [];
  }
  if (normalized.includes("..")) {
    throw new Error(`Unsafe Aliyun PDS remote directory: ${value}`);
  }
  return normalized.split("/").filter(Boolean);
}

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function sha256(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function sha1(bytes) {
  return createHash("sha1").update(bytes).digest("hex");
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--source") {
      parsed.source = argv[index + 1];
      index += 1;
    } else if (arg === "--remote-dir") {
      parsed.remoteDir = argv[index + 1];
      index += 1;
    } else if (arg === "--remote-name") {
      parsed.remoteName = argv[index + 1];
      index += 1;
    } else if (arg === "--verify-download") {
      parsed.verifyDownload = true;
    } else if (arg === "--require-encryption") {
      parsed.requireEncryption = true;
    } else if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return parsed;
}

function toDryRunReport(config, prepared) {
  return {
    ok: true,
    dryRun: true,
    provider: "aliyun-pds",
    endpoint: config.endpoint,
    domainId: config.domainId,
    remoteDir: args.remoteDir ?? config.remoteDir,
    file: {
      name: prepared.name,
      sizeBytes: prepared.bytes.byteLength,
      hash: prepared.hash,
      encrypted: prepared.encrypted
    }
  };
}

function printHelp() {
  console.log(`Usage:
  npm run cms:upload-aliyun-pds -- --source <backup.tar.gz> [options]

Options:
  --remote-dir <path>       Aliyun PDS directory. Default: ${DEFAULT_REMOTE_DIR}
  --remote-name <name>      Remote filename. Default: source basename
  --verify-download         Download the uploaded file and verify sha256
  --require-encryption      Fail unless ALIYUN_PDS_ENCRYPTION_PASSPHRASE is set
  --dry-run                 Prepare payload and print a redacted plan without network upload

Required environment:
  ALIYUN_PDS_DOMAIN_ID
  ALIYUN_PDS_CLIENT_ID
  ALIYUN_PDS_REFRESH_TOKEN

Optional environment:
  ALIYUN_PDS_ENDPOINT
  ALIYUN_PDS_CLIENT_SECRET
  ALIYUN_PDS_DRIVE_ID
  ALIYUN_PDS_PARENT_FILE_ID
  ALIYUN_PDS_REMOTE_DIR
  ALIYUN_PDS_ENCRYPTION_PASSPHRASE
`);
}

await main();
