import { randomUUID } from "node:crypto";
import type { AuditAction, AuditEvent, PaginatedResult } from "../types.ts";
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

export interface AuditListQuery {
  action?: AuditAction;
  articleId?: string;
  assetId?: string;
  page: number;
  pageSize: number;
}

export async function listAuditEvents(query: AuditListQuery): Promise<PaginatedResult<AuditEvent>> {
  const filter = compact({
    action: query.action,
    articleId: query.articleId,
    assetId: query.assetId
  });
  const database = await getCmsDatabase();
  if (database) {
    const collection = database.collection<AuditEvent>("audit_events");
    const total = await collection.countDocuments(filter);
    const items = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((query.page - 1) * query.pageSize)
      .limit(query.pageSize)
      .toArray();
    return { items: items.map(redactAuditEvent), page: query.page, pageSize: query.pageSize, total };
  }

  let items = [...getCmsMemoryStore().auditEvents];
  if (query.action) {
    items = items.filter((event) => event.action === query.action);
  }
  if (query.articleId) {
    items = items.filter((event) => event.articleId === query.articleId);
  }
  if (query.assetId) {
    items = items.filter((event) => event.assetId === query.assetId);
  }
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    items: items.slice((query.page - 1) * query.pageSize, query.page * query.pageSize).map(redactAuditEvent),
    page: query.page,
    pageSize: query.pageSize,
    total: items.length
  };
}

function sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (/token|secret|password|uri|key/i.test(key)) {
      safe[key] = "[redacted]";
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      safe[key] = sanitizeDetails(value as Record<string, unknown>);
    } else {
      safe[key] = value;
    }
  }
  return safe;
}

function redactAuditEvent(event: AuditEvent): AuditEvent {
  return {
    ...event,
    details: sanitizeDetails(event.details ?? {})
  };
}

function compact<T extends Record<string, unknown>>(value: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== ""));
}
