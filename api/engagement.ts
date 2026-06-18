import { MongoClient } from "mongodb";

const AUTHOR_MAX_LENGTH = 10;
const COMMENT_MAX_LENGTH = 100;

interface ApiRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

interface PublicComment {
  id: string;
  articleId: string;
  author: string;
  body: string;
  status: "approved";
  createdAt: string;
}

interface StoredComment extends PublicComment {
  visitorHash: string;
}

interface MemoryStore {
  comments: StoredComment[];
  likes: Set<string>;
  rateLimits: Map<string, number[]>;
}

type GlobalWithEngagement = typeof globalThis & {
  __engagementMemory?: MemoryStore;
  __engagementMongo?: Promise<MongoClient>;
  __engagementIndexesReady?: boolean;
};

const globalStore = globalThis as GlobalWithEngagement;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  try {
    if (req.method === "GET") {
      const articleId = normalizeArticleId(first(req.query?.articleId));
      const visitorId = normalizeVisitorId(header(req, "x-visitor-id") ?? first(req.query?.visitorId));
      res.status(200).json(await getEngagementSnapshot(articleId, visitorId));
      return;
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      const action = String(body.action ?? "");

      if (action === "like") {
        const articleId = normalizeArticleId(body.articleId);
        const visitorId = normalizeVisitorId(body.visitorId);
        res.status(200).json(await toggleLike(articleId, visitorId));
        return;
      }

      if (action === "comment") {
        const comment = await createComment(validateCommentDraft(body));
        res.status(201).json({ comment });
        return;
      }

      throw new Error("未知互动操作。");
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "请求失败。" });
  }
}

async function getEngagementSnapshot(articleId: string, visitorId: string) {
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

  const memory = getRuntimeMemoryStore();
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

async function toggleLike(articleId: string, visitorId: string) {
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

  const memory = getRuntimeMemoryStore();
  enforceRateLimit(memory, `${visitorHash}:like`, 30, 60_000);
  const key = likeKey(articleId, visitorHash);
  const liked = !memory.likes.has(key);
  if (liked) {
    memory.likes.add(key);
  } else {
    memory.likes.delete(key);
  }
  return { liked, likes: countMemoryLikes(memory, articleId) };
}

async function createComment(input: {
  articleId: string;
  visitorId: string;
  author: string;
  body: string;
}) {
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
    const memory = getRuntimeMemoryStore();
    enforceRateLimit(memory, `${visitorHash}:comment`, 6, 60_000);
    memory.comments.push(comment);
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

async function readBody(req: ApiRequest) {
  if (typeof req.body === "string") {
    return JSON.parse(req.body);
  }
  if (req.body && typeof req.body === "object") {
    return req.body as Record<string, unknown>;
  }
  return {};
}

function normalizeArticleId(value: unknown) {
  const articleId = String(value ?? "").trim();

  if (
    !/^[a-zA-Z0-9][a-zA-Z0-9:_-]{1,119}$/.test(articleId) ||
    articleId.includes("..") ||
    articleId.length < 2 ||
    articleId.length > 120
  ) {
    throw new Error("文章标识不合法。");
  }

  return articleId;
}

function normalizeVisitorId(value: unknown) {
  const visitorId = String(value ?? "").trim();
  if (!/^[a-zA-Z0-9_-]{16,80}$/.test(visitorId)) {
    throw new Error("访客标识不合法。");
  }
  return visitorId;
}

function validateCommentDraft(input: Record<string, unknown>) {
  const articleId = normalizeArticleId(input.articleId);
  const visitorId = normalizeVisitorId(input.visitorId);
  const author = cleanText(input.author);
  const body = cleanText(input.body);

  if (author.length < 1) {
    throw new Error("昵称不能为空。");
  }

  assertMaxCharacters(author, AUTHOR_MAX_LENGTH, "昵称");

  if (body.length < 2) {
    throw new Error("评论至少需要 2 个字符。");
  }

  assertMaxCharacters(body, COMMENT_MAX_LENGTH, "评论");

  return {
    articleId,
    visitorId,
    author,
    body
  };
}

function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
}

function assertMaxCharacters(value: string, maxLength: number, label: string) {
  if (Array.from(value).length > maxLength) {
    throw new Error(`${label}最多 ${maxLength} 个字。`);
  }
}

function getRuntimeMemoryStore() {
  if (!globalStore.__engagementMemory) {
    globalStore.__engagementMemory = {
      comments: [
        {
          id: "demo-approved",
          articleId: "post:20180301-algorithm-js-misc-1",
          author: "Daishuyuan",
          body: "这是一条示例评论。",
          status: "approved",
          createdAt: new Date().toISOString(),
          visitorHash: "demo"
        }
      ],
      likes: new Set<string>(),
      rateLimits: new Map<string, number[]>()
    };
  }
  return globalStore.__engagementMemory;
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

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function header(req: ApiRequest, name: string) {
  const lower = name.toLowerCase();
  const value = req.headers?.[lower] ?? req.headers?.[name];
  return Array.isArray(value) ? value[0] : value;
}
