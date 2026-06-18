import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { MongoClient } from "mongodb";
import { articleIdsByLegacySlug, getArticleIdForLegacySlug } from "../articleIdentity";
import type { EngagementSnapshot, PublicComment } from "../types";
import type { ValidatedCommentDraft } from "../validation";

declare const process: {
  env: Record<string, string | undefined>;
  cwd: () => string;
};

interface StoredComment extends PublicComment {
  visitorHash: string;
}

interface MemoryStore {
  comments: StoredComment[];
  likes: Set<string>;
  rateLimits: Map<string, number[]>;
}

interface SerializedMemoryStore {
  comments: Array<StoredComment | LegacyStoredComment>;
  likes: string[];
}

interface LegacyStoredComment extends Omit<StoredComment, "articleId"> {
  slug?: string;
  articleId?: string;
}

type GlobalWithEngagement = typeof globalThis & {
  __engagementMemory?: MemoryStore;
  __engagementMongo?: Promise<MongoClient>;
  __engagementIndexesReady?: boolean;
};

const globalStore = globalThis as GlobalWithEngagement;

export async function getEngagementSnapshot(articleId: string, visitorId: string): Promise<EngagementSnapshot> {
  const visitorHash = hashValue(visitorId);
  const mongo = await getMongo();
  if (mongo) {
    const database = mongo.db(process.env.MONGODB_DB ?? "dsy_blog");
    const comments = database.collection<StoredComment>("comments");
    const likes = database.collection<{ articleId: string; visitorHash: string; createdAt: string }>("likes");
    await ensureIndexes(comments, likes);

    const [approved, likeCount, liked] = await Promise.all([
      comments.find({ articleId, status: "approved" }).sort({ createdAt: -1 }).limit(50).toArray(),
      likes.countDocuments({ articleId }),
      likes.findOne({ articleId, visitorHash })
    ]);

    return {
      articleId,
      likes: likeCount,
      liked: Boolean(liked),
      comments: approved.map(toPublicComment),
      mode: "atlas"
    };
  }

  const memory = await getLocalStore();
  return {
    articleId,
    likes: countMemoryLikes(memory, articleId),
    liked: memory.likes.has(likeKey(articleId, visitorHash)),
    comments: memory.comments
      .filter((comment) => comment.articleId === articleId && comment.status === "approved")
      .slice(-50)
      .reverse()
      .map(toPublicComment),
    mode: "memory"
  };
}

export async function toggleLike(articleId: string, visitorId: string) {
  const visitorHash = hashValue(visitorId);
  const mongo = await getMongo();

  if (mongo) {
    enforceRateLimit(getRuntimeMemoryStore(), `${visitorHash}:like`, 30, 60_000);
    const database = mongo.db(process.env.MONGODB_DB ?? "dsy_blog");
    const comments = database.collection<StoredComment>("comments");
    const likes = database.collection<{ articleId: string; visitorHash: string; createdAt: string }>("likes");
    await ensureIndexes(comments, likes);

    const existing = await likes.findOne({ articleId, visitorHash });
    if (existing) {
      await likes.deleteOne({ articleId, visitorHash });
    } else {
      await likes.insertOne({ articleId, visitorHash, createdAt: new Date().toISOString() });
    }
    const likeCount = await likes.countDocuments({ articleId });
    return { liked: !existing, likes: likeCount };
  }

  const memory = await getLocalStore();
  enforceRateLimit(memory, `${visitorHash}:like`, 30, 60_000);
  const key = likeKey(articleId, visitorHash);
  const liked = !memory.likes.has(key);
  if (liked) {
    memory.likes.add(key);
  } else {
    memory.likes.delete(key);
  }
  await saveLocalStore(memory);
  return { liked, likes: countMemoryLikes(memory, articleId) };
}

export async function createComment(input: ValidatedCommentDraft) {
  const visitorHash = hashValue(input.visitorId);
  const comment: StoredComment = {
    id: createId(),
    articleId: input.articleId,
    author: input.author,
    body: input.body,
    status: "approved",
    createdAt: new Date().toISOString(),
    visitorHash
  };

  const mongo = await getMongo();
  if (mongo) {
    enforceRateLimit(getRuntimeMemoryStore(), `${visitorHash}:comment`, 6, 60_000);
    const database = mongo.db(process.env.MONGODB_DB ?? "dsy_blog");
    const comments = database.collection<StoredComment>("comments");
    const likes = database.collection<{ articleId: string; visitorHash: string; createdAt: string }>("likes");
    await ensureIndexes(comments, likes);

    await comments.insertOne(comment);
  } else {
    const memory = await getLocalStore();
    enforceRateLimit(memory, `${visitorHash}:comment`, 6, 60_000);
    memory.comments.push(comment);
    await saveLocalStore(memory);
  }

  return toPublicComment(comment);
}

async function getMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return null;
  }

  if (!globalStore.__engagementMongo) {
    globalStore.__engagementMongo = new MongoClient(uri).connect();
  }
  return globalStore.__engagementMongo;
}

async function ensureIndexes(
  comments: {
    createIndex: (keys: Record<string, 1 | -1>, options?: Record<string, unknown>) => Promise<string>;
  },
  likes: {
    createIndex: (keys: Record<string, 1 | -1>, options?: Record<string, unknown>) => Promise<string>;
  }
) {
  if (globalStore.__engagementIndexesReady) {
    return;
  }

  await Promise.all([
    comments.createIndex({ articleId: 1, status: 1, createdAt: -1 }),
    comments.createIndex({ articleId: 1, visitorHash: 1, createdAt: -1 }),
    likes.createIndex({ articleId: 1, visitorHash: 1 }, { unique: true })
  ]);
  globalStore.__engagementIndexesReady = true;
}

function getRuntimeMemoryStore() {
  if (!globalStore.__engagementMemory) {
    globalStore.__engagementMemory = createSeededMemoryStore();
  }
  return globalStore.__engagementMemory;
}

async function getLocalStore() {
  const rateLimits = globalStore.__engagementMemory?.rateLimits ?? new Map<string, number[]>();
  try {
    const parsed = JSON.parse(await readFile(getLocalStorePath(), "utf8")) as Partial<SerializedMemoryStore>;
    const migrated = migrateSerializedMemoryStore(parsed);
    if (migrated.changed) {
      await writeSerializedMemoryStore({
        comments: migrated.comments,
        likes: migrated.likes
      });
    }
    return {
      comments: migrated.comments,
      likes: new Set(migrated.likes),
      rateLimits
    };
  } catch (error) {
    if (isNodeError(error) && error.code !== "ENOENT") {
      console.warn("Failed to read local engagement store, recreating it.", error);
    }
    return createSeededMemoryStore(rateLimits);
  }
}

async function saveLocalStore(memory: MemoryStore) {
  globalStore.__engagementMemory = memory;
  await writeSerializedMemoryStore({
    comments: memory.comments,
    likes: Array.from(memory.likes)
  });
}

async function writeSerializedMemoryStore(memory: Omit<SerializedMemoryStore, "comments"> & { comments: StoredComment[] }) {
  const storePath = getLocalStorePath();
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(
    storePath,
    JSON.stringify(
      {
        comments: memory.comments,
        likes: memory.likes
      } satisfies SerializedMemoryStore,
      null,
      2
    )
  );
}

function migrateSerializedMemoryStore(parsed: Partial<SerializedMemoryStore>) {
  const comments: StoredComment[] = [];
  const likes = new Set<string>();
  let changed = false;

  for (const comment of Array.isArray(parsed.comments) ? parsed.comments : []) {
    if (typeof comment.articleId === "string") {
      comments.push({ ...comment, articleId: comment.articleId });
      continue;
    }

    const articleId = typeof comment.slug === "string" ? getArticleIdForLegacySlug(comment.slug) : undefined;
    if (articleId) {
      const { slug: _slug, ...rest } = comment;
      comments.push({ ...rest, articleId });
    }
    changed = true;
  }

  for (const key of Array.isArray(parsed.likes) ? parsed.likes : []) {
    const migratedKey = migrateLikeKey(key);
    if (migratedKey) {
      likes.add(migratedKey);
    }
    if (migratedKey !== key) {
      changed = true;
    }
  }

  return {
    comments,
    likes: Array.from(likes),
    changed
  };
}

function migrateLikeKey(key: string) {
  if (key.startsWith("post:")) {
    return key;
  }

  for (const [slug, articleId] of articleIdsByLegacySlug) {
    const prefix = `${slug}:`;
    if (key.startsWith(prefix)) {
      return `${articleId}:${key.slice(prefix.length)}`;
    }
  }

  return null;
}

function createSeededMemoryStore(rateLimits = new Map<string, number[]>()) {
  return {
    comments: [
      {
        id: "demo-approved",
        articleId: "post:20180301-algorithm-js-misc-1",
        author: "Daishuyuan",
        body: "这是一条示例评论。",
        status: "approved" as const,
        createdAt: new Date().toISOString(),
        visitorHash: "demo"
      }
    ],
    likes: new Set<string>(),
    rateLimits
  };
}

function getLocalStorePath() {
  return process.env.ENGAGEMENT_LOCAL_STORE_PATH ?? join(process.cwd(), ".local-engagement-store.json");
}

function isNodeError(error: unknown): error is { code?: string } {
  return Boolean(error && typeof error === "object" && "code" in error);
}

function enforceRateLimit(memory: MemoryStore, key: string, maxHits: number, windowMs: number) {
  const now = Date.now();
  const hits = (memory.rateLimits.get(key) ?? []).filter((time) => now - time < windowMs);
  if (hits.length >= maxHits) {
    throw new Error("操作太频繁，请稍后再试。");
  }
  hits.push(now);
  memory.rateLimits.set(key, hits);
}

function countMemoryLikes(memory: MemoryStore, articleId: string) {
  return Array.from(memory.likes).filter((key) => key.startsWith(`${articleId}:`)).length;
}

function likeKey(articleId: string, visitorHash: string) {
  return `${articleId}:${visitorHash}`;
}

function hashValue(value: string) {
  const salt = process.env.ENGAGEMENT_HASH_SALT ?? "local-demo";
  const input = `${salt}:${value}`;
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function toPublicComment(comment: StoredComment): PublicComment {
  return {
    id: comment.id,
    articleId: comment.articleId,
    author: comment.author,
    body: comment.body,
    status: comment.status,
    createdAt: comment.createdAt
  };
}
