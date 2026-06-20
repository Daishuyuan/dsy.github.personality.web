import { randomUUID } from "node:crypto";
import type { AuditAction, AuditEvent } from "../types.ts";
import { getCmsMemoryStore } from "./memoryStore.ts";
import { getCmsDatabase } from "./mongo.ts";

export async function writeAuditEvent(input: {
  action: AuditAction;
  actor?: string;
  articleId?: string;
  assetId?: string;
  requestId?: string;
  idempotencyKeyHash?: string;
  details?: Record<string, unknown>;
}): Promise<AuditEvent> {
  const event: AuditEvent = {
    eventId: `audit_${randomUUID()}`,
    action: input.action,
    actor: input.actor ?? "owner",
    articleId: input.articleId,
    assetId: input.assetId,
    requestId: input.requestId,
    idempotencyKeyHash: input.idempotencyKeyHash,
    details: sanitizeDetails(input.details ?? {}),
    createdAt: new Date().toISOString()
  };

  const database = await getCmsDatabase();
  if (database) {
    await database.collection<AuditEvent>("audit_events").insertOne(event);
  } else {
    getCmsMemoryStore().auditEvents.push(event);
  }
  return event;
}

function sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (/token|secret|password|uri|key/i.test(key)) {
      safe[key] = "[redacted]";
    } else {
      safe[key] = value;
    }
  }
  return safe;
}
