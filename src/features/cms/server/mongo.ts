import { MongoClient } from "mongodb";
import { getCmsEnv } from "./env.ts";

export class CmsDatabaseUnavailableError extends Error {
  readonly reason: "missing-config" | "timeout" | "connection-error";

  constructor(
    message = "数据库暂时不可用，文章无法加载。",
    reason: "missing-config" | "timeout" | "connection-error" = "connection-error"
  ) {
    super(message);
    this.name = "CmsDatabaseUnavailableError";
    this.reason = reason;
  }
}

type GlobalWithCmsMongo = typeof globalThis & {
  __cmsMongo?: Promise<MongoClient>;
};

const globalStore = globalThis as GlobalWithCmsMongo;

export async function getMongoClient(): Promise<MongoClient | null> {
  const env = getCmsEnv();
  const uri = env.mongodbUri;
  if (!uri) {
    return null;
  }
  if (!globalStore.__cmsMongo) {
    globalStore.__cmsMongo = new MongoClient(uri, {
      serverSelectionTimeoutMS: env.mongodbTimeoutMs,
      connectTimeoutMS: env.mongodbTimeoutMs,
      socketTimeoutMS: env.mongodbTimeoutMs
    }).connect();
  }
  try {
    return await globalStore.__cmsMongo;
  } catch (error) {
    globalStore.__cmsMongo = undefined;
    throw toDatabaseError(error);
  }
}

export async function getCmsDatabase() {
  const client = await getMongoClient();
  if (!client) {
    return null;
  }
  return client.db(getCmsEnv().mongodbDb);
}

export async function requireCmsDatabase() {
  const database = await getCmsDatabase();
  if (!database) {
    throw new CmsDatabaseUnavailableError("数据库未配置，文章无法加载。", "missing-config");
  }
  return database;
}

export function canUseMemoryRepository(): boolean {
  return getCmsEnv().allowMemoryRepository;
}

function toDatabaseError(error: unknown): CmsDatabaseUnavailableError {
  const message = error instanceof Error ? error.message : String(error);
  if (/timed out|timeout|server selection/i.test(message)) {
    return new CmsDatabaseUnavailableError("数据库连接超时，文章无法加载。", "timeout");
  }
  return new CmsDatabaseUnavailableError("数据库连接失败，文章无法加载。", "connection-error");
}
