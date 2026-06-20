export interface IdempotencyRecord {
  payloadHash: string;
  result: unknown;
}

type GlobalWithIdempotency = typeof globalThis & {
  __cmsIdempotency?: Map<string, IdempotencyRecord>;
};

const globalStore = globalThis as GlobalWithIdempotency;

export function findIdempotentResult(keyHash: string): IdempotencyRecord | undefined {
  return getIdempotencyStore().get(keyHash);
}

export function saveIdempotentResult(keyHash: string, record: IdempotencyRecord): void {
  getIdempotencyStore().set(keyHash, record);
}

function getIdempotencyStore(): Map<string, IdempotencyRecord> {
  if (!globalStore.__cmsIdempotency) {
    globalStore.__cmsIdempotency = new Map();
  }
  return globalStore.__cmsIdempotency;
}
