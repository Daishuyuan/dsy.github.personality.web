import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface CmsEnv {
  mongodbUri?: string;
  mongodbDb: string;
  adminToken?: string;
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  supabaseStorageBucket: string;
  mongodbTimeoutMs: number;
  allowMemoryRepository: boolean;
}

export function getCmsEnv(): CmsEnv {
  return {
    mongodbUri: readEnv("MONGODB_URI"),
    mongodbDb: readEnv("MONGODB_DB") ?? "dsy_blog",
    adminToken: readEnv("ADMIN_TOKEN"),
    supabaseUrl: readEnv("SUPABASE_URL"),
    supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
    supabaseStorageBucket: readEnv("SUPABASE_STORAGE_BUCKET") ?? "blog-images",
    mongodbTimeoutMs: parsePositiveInteger(readEnv("MONGODB_TIMEOUT_MS"), 5000),
    allowMemoryRepository: readEnv("CMS_ALLOW_MEMORY_REPOSITORY") === "true" || process.env.NODE_ENV === "test"
  };
}

export function requireAdminToken(): string {
  const token = getCmsEnv().adminToken;
  if (!token) {
    throw new Error("ADMIN_TOKEN is not configured");
  }
  return token;
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function readEnv(name: string): string | undefined {
  if (process.env[name] !== undefined) {
    return process.env[name];
  }
  if (process.env.NODE_ENV === "test") {
    return undefined;
  }
  return readLocalEnv()[name];
}

let localEnvCache: Record<string, string> | undefined;

function readLocalEnv(): Record<string, string> {
  if (localEnvCache) {
    return localEnvCache;
  }

  localEnvCache = [".env", ".env.local"].reduce<Record<string, string>>((env, filename) => {
    return { ...env, ...readEnvFile(resolve(process.cwd(), filename)) };
  }, {});

  return localEnvCache;
}

function readEnvFile(path: string): Record<string, string> {
  try {
    return parseEnvFile(readFileSync(path, "utf8"));
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

function parseEnvFile(content: string): Record<string, string> {
  return content.split(/\r?\n/).reduce<Record<string, string>>((env, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return env;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex < 1) {
      return env;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      return env;
    }

    return {
      ...env,
      [key]: unwrapEnvValue(rawValue)
    };
  }, {});
}

function unwrapEnvValue(value: string): string {
  const quote = value[0];
  if ((quote === "\"" || quote === "'") && value.endsWith(quote)) {
    return value.slice(1, -1);
  }
  return value;
}

function isNodeError(error: unknown): error is { code?: string } {
  return Boolean(error && typeof error === "object" && "code" in error);
}
