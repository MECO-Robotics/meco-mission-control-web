import type { FindingRetestRecord, QaFindingRecord } from "@/types/recordsReporting";

export interface RetestOperationPayload {
  operationId: string;
  sourceType: "qa" | "test";
  result: "pass" | "fail";
  notes: string;
  evidenceNotes?: string;
  observedAt?: string;
}

export interface RetestOperationStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function retestOperationStorageKey(scope: string, sourceType: RetestOperationPayload["sourceType"], findingId: string) {
  return `mission-control:retest:v1:${encodeURIComponent(scope)}:${sourceType}:${encodeURIComponent(findingId)}`;
}

export function persistRetestOperation(storage: RetestOperationStorage | undefined, scope: string, findingId: string, payload: RetestOperationPayload, state: "pending" | "acknowledged" = "pending") {
  return writeRetestOperation(storage, scope, findingId, payload, state);
}

export function markRetestOperationConflict(storage: RetestOperationStorage | undefined, scope: string, findingId: string, payload: RetestOperationPayload) {
  return writeRetestOperation(storage, scope, findingId, payload, "conflict");
}

function writeRetestOperation(storage: RetestOperationStorage | undefined, scope: string, findingId: string, payload: RetestOperationPayload, state: "pending" | "conflict" | "acknowledged") {
  if (!storage || !isValidRetestPayload(payload)) return false;
  const key = retestOperationStorageKey(scope, payload.sourceType, findingId);
  const value = JSON.stringify({ version: 1, scope, findingId, state, payload });
  try {
    storage.setItem(key, value);
    return storage.getItem(key) === value;
  } catch {
    return false;
  }
}

export function restoreRetestOperation(storage: Pick<RetestOperationStorage, "getItem"> | undefined, scope: string, sourceType: RetestOperationPayload["sourceType"], findingId: string) {
  if (!storage) return { kind: "none" as const };
  try {
    const value = storage.getItem(retestOperationStorageKey(scope, sourceType, findingId));
    if (value === null) return { kind: "none" as const };
    const record = JSON.parse(value) as { version?: unknown; scope?: unknown; findingId?: unknown; state?: unknown; payload?: RetestOperationPayload };
    if (record.version !== 1 || record.scope !== scope || record.findingId !== findingId || (record.state !== undefined && record.state !== "pending" && record.state !== "conflict" && record.state !== "acknowledged") || !isValidRetestPayload(record.payload) || record.payload.sourceType !== sourceType) {
      return { kind: "invalid" as const };
    }
    return { kind: "valid" as const, payload: record.payload, conflict: record.state === "conflict", acknowledged: record.state === "acknowledged" };
  } catch {
    return { kind: "invalid" as const };
  }
}

export function reconcileRetestConflict(finding: QaFindingRecord | null, payload: RetestOperationPayload) {
  if (!finding || !Array.isArray(finding.retests)) return { kind: "unknown" as const };
  const operationRecords = finding.retests.filter((entry) => entry.operationId === payload.operationId);
  if (!operationRecords.length) return { kind: "not-found" as const };
  const record = operationRecords.find((entry) => !entry.sourceType || entry.sourceType === payload.sourceType);
  if (!record) return { kind: "unknown" as const };
  const intentMatches = record.result === payload.result && record.notes.trim() === payload.notes.trim() &&
    (record.evidenceNotes ?? "").trim() === (payload.evidenceNotes ?? "").trim() &&
    (record.observedAt ?? undefined) === (payload.observedAt ?? undefined);
  return { kind: "found" as const, record: record as FindingRetestRecord, intentMatches };
}

export function retestOperationIsCanonical(retests: unknown[] | undefined, operationId: string) {
  return retests?.some((entry) => typeof entry === "object" && entry !== null && "operationId" in entry && (entry as { operationId?: unknown }).operationId === operationId) ?? false;
}

export function clearRetestOperation(storage: RetestOperationStorage | undefined, scope: string, sourceType: RetestOperationPayload["sourceType"], findingId: string) {
  try { storage?.removeItem(retestOperationStorageKey(scope, sourceType, findingId)); } catch { /* Retain the key if browser storage is temporarily unavailable. */ }
}

export async function submitDurableRetest(options: {
  storage: RetestOperationStorage | undefined;
  scope: string;
  findingId: string;
  payload: RetestOperationPayload;
  write: (payload: RetestOperationPayload) => Promise<{ retests?: unknown[]; status?: QaFindingRecord["status"] }>;
}) {
  if (!persistRetestOperation(options.storage, options.scope, options.findingId, options.payload)) return { kind: "storage-failed" as const };
  try {
    const finding = await options.write(options.payload);
    if (retestOperationIsCanonical(finding.retests, options.payload.operationId)) {
      const saved = persistRetestOperation(options.storage, options.scope, options.findingId, options.payload, "acknowledged");
      return { kind: "acknowledged" as const, finding, storageFailed: !saved };
    }
    return { kind: "pending" as const, finding };
  } catch (error) {
    const statusCode = typeof error === "object" && error !== null && "statusCode" in error
      ? (error as { statusCode?: unknown }).statusCode
      : undefined;
    if (statusCode === 409) {
      markRetestOperationConflict(options.storage, options.scope, options.findingId, options.payload);
      return { kind: "conflict" as const, error };
    }
    if (typeof statusCode === "number" && statusCode >= 400 && statusCode < 500) {
      clearRetestOperation(options.storage, options.scope, options.payload.sourceType, options.findingId);
      return { kind: "rejected" as const, error };
    }
    return { kind: "pending" as const, error };
  }
}

function isValidRetestPayload(payload: unknown): payload is RetestOperationPayload {
  if (typeof payload !== "object" || payload === null) return false;
  const candidate = payload as Partial<RetestOperationPayload>;
  return typeof candidate.operationId === "string" && candidate.operationId.trim().length > 0 && candidate.operationId.length <= 200 &&
    (candidate.sourceType === "qa" || candidate.sourceType === "test") &&
    (candidate.result === "pass" || candidate.result === "fail") && typeof candidate.notes === "string" && candidate.notes.trim().length > 0 &&
    (candidate.evidenceNotes === undefined || typeof candidate.evidenceNotes === "string") &&
    (candidate.observedAt === undefined || typeof candidate.observedAt === "string");
}
