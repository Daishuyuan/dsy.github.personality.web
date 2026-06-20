import { createHash, randomUUID } from "node:crypto";
import type { ApiRequestLike } from "./apiResponse.ts";
import { first, header } from "./apiResponse.ts";
import { findIdempotentResult, saveIdempotentResult } from "./idempotencyRepository.ts";

type GlobalWithRateLimits = typeof globalThis & {
  __cmsRateLimits?: Map<string, number[]>;
};

const globalStore = globalThis as GlobalWithRateLimits;

export function createRequestId(): string {
  return randomUUID();
}

export function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function getIdempotencyKey(req: ApiRequestLike): string | undefined {
  return header(req, "idempotency-key");
}

export function getClientKey(req: ApiRequestLike): string {
  return header(req, "x-forwarded-for")?.split(",")[0]?.trim() ?? header(req, "x-real-ip") ?? "local";
}

export function enforceRateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const store = getRateLimits();
  const history = (store.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);
  if (history.length >= limit) {
    throw new Error("请求过于频繁。");
  }
  store.set(key, [...history, now]);
}

export async function withIdempotency<T>(
  req: ApiRequestLike,
  payload: unknown,
  run: () => Promise<T>
): Promise<T> {
  const key = getIdempotencyKey(req);
  if (!key) {
    return run();
  }
  const cacheKey = hashValue(key);
  const payloadHash = hashValue(JSON.stringify(payload));
  const existing = findIdempotentResult(cacheKey);
  if (existing) {
    if (existing.payloadHash !== payloadHash) {
      throw new Error("重复请求标识冲突。");
    }
    return existing.result as T;
  }
  const result = await run();
  saveIdempotentResult(cacheKey, { payloadHash, result });
  return result;
}

export function queryNumber(req: ApiRequestLike, name: string, fallback: number): number {
  const value = Number(first(req.query?.[name]));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function getRateLimits(): Map<string, number[]> {
  if (!globalStore.__cmsRateLimits) {
    globalStore.__cmsRateLimits = new Map();
  }
  return globalStore.__cmsRateLimits;
}
