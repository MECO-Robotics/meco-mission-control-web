import { clearRetestOperation, persistRetestOperation, reconcileRetestConflict, restoreRetestOperation, submitDurableRetest, type RetestOperationPayload, type RetestOperationStorage } from "../retestOperation";
import type { QaFindingRecord } from "@/types/recordsReporting";

function storageFixture(): RetestOperationStorage {
  const entries = new Map<string, string>();
  return { getItem: (key) => entries.get(key) ?? null, setItem: (key, value) => { entries.set(key, value); }, removeItem: (key) => { entries.delete(key); } };
}

const payload: RetestOperationPayload = { operationId: "op-stable-1", sourceType: "qa", result: "pass", notes: "Torque rechecked", observedAt: "2026-10-15T12:00:00.000Z" };

test("persists and restores the exact retry intent across reload and scopes it by account and category", () => {
  const storage = storageFixture();
  expect(persistRetestOperation(storage, "account:a:project:p", "finding-1", payload)).toBe(true);
  expect(restoreRetestOperation(storage, "account:a:project:p", "qa", "finding-1")).toEqual({ kind: "valid", payload, conflict: false });
  expect(restoreRetestOperation(storage, "account:b:project:p", "qa", "finding-1")).toEqual({ kind: "none" });
  expect(restoreRetestOperation(storage, "account:a:project:p", "test", "finding-1")).toEqual({ kind: "none" });
});

test("saves before the API request and retries an ambiguous response with the same key and payload", async () => {
  const storage = storageFixture();
  const seen: RetestOperationPayload[] = [];
  const write = jest.fn(async (request: RetestOperationPayload) => {
    const recovered = restoreRetestOperation(storage, "account:a:project:p", "qa", "finding-1");
    expect(recovered).toEqual({ kind: "valid", payload: request, conflict: false });
    seen.push(request);
    if (seen.length === 1) throw new Error("connection lost");
    return { retests: [{ operationId: request.operationId, result: request.result, notes: request.notes, reviewedAt: "2026-10-15T12:00:00.000Z", reviewedById: "mentor-1", order: 1 }] };
  });
  const first = await submitDurableRetest({ storage, scope: "account:a:project:p", findingId: "finding-1", payload, write });
  expect(first.kind).toBe("pending");
  const restoredAfterReload = restoreRetestOperation(storage, "account:a:project:p", "qa", "finding-1");
  expect(restoredAfterReload).toEqual({ kind: "valid", payload, conflict: false });
  const retry = await submitDurableRetest({ storage, scope: "account:a:project:p", findingId: "finding-1", payload: restoredAfterReload.kind === "valid" ? restoredAfterReload.payload : payload, write });
  expect(retry.kind).toBe("confirmed");
  expect(write).toHaveBeenCalledTimes(2);
  expect(seen).toEqual([payload, payload]);
  expect(restoreRetestOperation(storage, "account:a:project:p", "qa", "finding-1").kind).toBe("none");
});

test("fails closed when durable storage cannot save and unlocks after a confirmed rejection", async () => {
  const failingStorage: RetestOperationStorage = { getItem: () => null, setItem: () => { throw new Error("storage blocked"); }, removeItem: () => undefined };
  const write = jest.fn(async () => ({ retests: [] }));
  const failedSave = await submitDurableRetest({ storage: failingStorage, scope: "account:a", findingId: "finding-1", payload, write });
  expect(failedSave.kind).toBe("storage-failed");
  expect(write).not.toHaveBeenCalled();

  const storage = storageFixture();
  const rejected = await submitDurableRetest({ storage, scope: "account:a", findingId: "finding-1", payload, write: async () => { throw Object.assign(new Error("not allowed"), { statusCode: 403 }); } });
  expect(rejected.kind).toBe("rejected");
  expect(restoreRetestOperation(storage, "account:a", "qa", "finding-1").kind).toBe("none");
});

test("clears only the matching retest intent", () => {
  const storage = storageFixture();
  persistRetestOperation(storage, "account:a", "finding-1", payload);
  clearRetestOperation(storage, "account:a", "qa", "finding-1");
  expect(restoreRetestOperation(storage, "account:a", "qa", "finding-1").kind).toBe("none");
});

test("marks a 409 intent for canonical status checking and reconciles same-key changed payload accurately", async () => {
  const storage = storageFixture();
  const conflict = await submitDurableRetest({ storage, scope: "account:a", findingId: "finding-1", payload, write: async () => { throw Object.assign(new Error("conflict"), { statusCode: 409 }); } });
  expect(conflict.kind).toBe("conflict");
  expect(restoreRetestOperation(storage, "account:a", "qa", "finding-1")).toEqual({ kind: "valid", payload, conflict: true });
  const canonical = { id: "finding-1", retests: [{ operationId: payload.operationId, sourceType: "qa", result: "fail", notes: "Prior review", reviewedAt: "server-time", reviewedById: "mentor-1", order: 3 }] } as unknown as QaFindingRecord;
  expect(reconcileRetestConflict(canonical, payload)).toMatchObject({ kind: "found", intentMatches: false, record: { result: "fail", notes: "Prior review", order: 3 } });
  expect(reconcileRetestConflict({ id: "finding-1", retests: [] } as unknown as QaFindingRecord, payload)).toEqual({ kind: "not-found" });
  expect(reconcileRetestConflict(null, payload)).toEqual({ kind: "unknown" });
});
