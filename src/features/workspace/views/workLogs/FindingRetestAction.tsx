import { useEffect, useRef, useState, type FormEvent } from "react";

import { createClientOperationId } from "@/lib/appUtils/clientOperationId";
import { retestReportFindingRecord } from "@/lib/auth/records/reporting";
import type { FindingRetestRecord, QaFindingRecord } from "@/types/recordsReporting";
import { clearRetestOperation, persistRetestOperation, reconcileRetestConflict, restoreRetestOperation, retestOperationIsCanonical, submitDurableRetest, type RetestOperationPayload, type RetestOperationStorage } from "./retestOperation";

interface FindingRetestActionProps {
  finding: QaFindingRecord;
  sourceType: "qa" | "test";
  scope: string;
  viewScope?: string;
  canReview: boolean;
  handleUnauthorized?: () => void;
  members: Array<{ id: string; name: string }>;
  loadWorkspace?: () => Promise<unknown>;
  setDataMessage?: (message: string | null) => void;
  readFinding: (findingId: string, sourceType: "qa" | "test") => Promise<QaFindingRecord | null>;
}

type ConflictState = "checking" | "unknown" | "not-found" | "acknowledged" | null;

function getStorage(): RetestOperationStorage | undefined {
  try { return globalThis.localStorage; } catch { return undefined; }
}

function retestDescription(record: FindingRetestRecord) {
  return `${record.result === "pass" ? "Passed" : "Needs more work"}: ${record.notes}`;
}

export function FindingRetestAction({ finding, sourceType, scope, viewScope = "", canReview, handleUnauthorized, members, loadWorkspace, setDataMessage, readFinding }: FindingRetestActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<"pass" | "fail">("pass");
  const [notes, setNotes] = useState("");
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [pendingPayload, setPendingPayload] = useState<RetestOperationPayload | null>(null);
  const [conflictState, setConflictState] = useState<ConflictState>(null);
  const [historyOverride, setHistoryOverride] = useState<FindingRetestRecord[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const viewActive = useRef(true);

  useEffect(() => {
    viewActive.current = true;
    return () => { viewActive.current = false; };
  }, [viewScope]);

  useEffect(() => {
    const storage = getStorage();
    const restored = restoreRetestOperation(storage, scope, sourceType, finding.id);
    if (restored.kind === "invalid") {
      setStorageBlocked(true);
      setMessage("Saved retest details could not be read. Refresh the finding before recording another retest.");
      return;
    }
    if (restored.kind !== "valid") return;
    if (retestOperationIsCanonical(finding.retests, restored.payload.operationId)) {
      clearRetestOperation(storage, scope, sourceType, finding.id);
      setPendingPayload(null);
      return;
    }
    setPendingPayload(restored.payload);
    setResult(restored.payload.result);
    setNotes(restored.payload.notes);
    setEvidenceNotes(restored.payload.evidenceNotes ?? "");
    if (restored.acknowledged) {
      setConflictState("acknowledged");
      setMessage("Retest was accepted. Waiting for the refreshed finding history before another check can be recorded.");
      setHistoryOverride(null);
      setIsOpen(false);
    } else if (restored.conflict) {
      setConflictState("unknown");
      setMessage("We couldn't confirm this check. Check its status before trying again.");
      setIsOpen(false);
    } else {
      setConflictState(null);
      setMessage("We couldn't confirm this check. You can check it again using the same details.");
      setIsOpen(true);
    }
  }, [finding.id, finding.retests, scope, sourceType, viewScope]);

  useEffect(() => {
    if (!pendingPayload || !retestOperationIsCanonical(finding.retests, pendingPayload.operationId)) return;
    clearRetestOperation(getStorage(), scope, sourceType, finding.id);
    setPendingPayload(null);
    setConflictState(null);
    setIsOpen(false);
    setStorageBlocked(false);
  }, [finding.id, finding.retests, pendingPayload, scope, sourceType]);

  useEffect(() => setHistoryOverride(null), [finding.retests]);

  const reconcilePending = async (payload: RetestOperationPayload) => {
    setConflictState("checking");
    setIsCheckingStatus(true);
    setIsOpen(false);
    try {
      const canonicalFinding = await readFinding(finding.id, sourceType);
      if (!viewActive.current) return;
      const reconciliation = reconcileRetestConflict(canonicalFinding, payload);
      if (reconciliation.kind === "unknown") {
        setConflictState("unknown");
        setMessage("We couldn't check the finding history. Your saved check is still pending.");
        return;
      }
      if (canonicalFinding) setHistoryOverride((canonicalFinding.retests ?? []) as FindingRetestRecord[]);
      if (reconciliation.kind === "found") {
        persistRetestOperation(getStorage(), scope, finding.id, payload, "acknowledged");
        setPendingPayload(payload);
        setConflictState("acknowledged");
        setIsOpen(false);
        setMessage(reconciliation.intentMatches
          ? `This check is already in the history: ${retestDescription(reconciliation.record)}.`
          : `A different check is already recorded for this operation: ${retestDescription(reconciliation.record)}. Your newer details were not recorded.`);
        try { await loadWorkspace?.(); } catch { /* The canonical finding read is enough to show the saved history. */ }
        return;
      }
      setConflictState("not-found");
      setMessage("This operation was not found in the current finding history. Start a new check to try again.");
    } catch {
      if (viewActive.current) {
        setConflictState("unknown");
        setMessage("We couldn't check the finding history. Your saved check is still pending.");
      }
    } finally {
      if (viewActive.current) setIsCheckingStatus(false);
    }
  };

  const checkStatus = () => {
    if (!canReview || isCheckingStatus || !pendingPayload) return;
    void reconcilePending(pendingPayload);
  };

  const startNewCheck = () => {
    if (!canReview || conflictState !== "not-found") return;
    clearRetestOperation(getStorage(), scope, sourceType, finding.id);
    setPendingPayload(null);
    setConflictState(null);
    setResult("pass");
    setNotes("");
    setEvidenceNotes("");
    setMessage(null);
    setIsOpen(true);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canReview || isSaving || storageBlocked || conflictState || !notes.trim()) return;
    const payload = pendingPayload ?? {
      operationId: createClientOperationId(),
      sourceType,
      result,
      notes: notes.trim(),
      ...(evidenceNotes.trim() ? { evidenceNotes: evidenceNotes.trim() } : {}),
      observedAt: new Date().toISOString(),
    } satisfies RetestOperationPayload;
    setIsSaving(true);
    setMessage(null);
    setDataMessage?.(null);
    const outcome = await submitDurableRetest({
      storage: getStorage(),
      scope,
      findingId: finding.id,
      payload,
      write: (request) => retestReportFindingRecord(finding.id, request, handleUnauthorized),
    });
    if (!viewActive.current) return;
    if (outcome.kind === "storage-failed") {
      setMessage("We couldn't save this check safely. Check browser storage settings and try again.");
      setIsSaving(false);
      return;
    }
    if (outcome.kind === "rejected") {
      setPendingPayload(null);
      setConflictState(null);
      setStorageBlocked(false);
      setMessage("This check could not be recorded. Review the details and try again.");
      setIsSaving(false);
      return;
    }
    if (outcome.kind === "conflict") {
      setPendingPayload(payload);
      setMessage(null);
      setIsSaving(false);
      await reconcilePending(payload);
      return;
    }
    if (outcome.kind === "acknowledged") {
      setPendingPayload(payload);
      setConflictState("acknowledged");
      setIsOpen(false);
      setHistoryOverride((outcome.finding.retests ?? []) as FindingRetestRecord[]);
      setMessage(`${outcome.finding.status === "resolved" ? "Retest recorded. The finding is closed after this review." : "Retest recorded. The finding remains open for follow-up."} Waiting for refreshed history before another check can be recorded.`);
      try { await loadWorkspace?.(); } catch { if (viewActive.current) setMessage("Retest recorded, but the finding could not refresh. Refresh the workspace to see its current status."); }
    } else {
      setPendingPayload(payload);
      setConflictState(null);
      setMessage("We couldn't confirm this check. You can check it again using the same details.");
      try { await loadWorkspace?.(); } catch { /* The saved operation remains available for another safe attempt. */ }
    }
    setIsSaving(false);
  };

  const canonicalHistory = historyOverride ?? finding.retests ?? [];
  const reviewerLabel = (reviewedById: string) => members.find((member) => member.id === reviewedById)?.name ?? "Reviewer unavailable";
  const showRecoveryAction = conflictState !== null;

  return <div className="qa-finding-retest-action">
    {canonicalHistory.length ? <ul aria-label="Retest history">{canonicalHistory.map((entry, index) => <li key={`${entry.operationId ?? "legacy"}-${index}`}>{entry.result === "pass" ? "Passed" : "Needs more work"} · {reviewerLabel(entry.reviewedById)} · reviewed {entry.reviewedAt} · review {entry.order}{entry.observedAt ? ` · observed ${entry.observedAt}` : ""}</li>)}</ul> : null}
    {canReview ? isOpen && !showRecoveryAction ? <form className="qa-finding-retest" onSubmit={(event) => void submit(event)}>
      <label className="field"><span>Retest result</span><select disabled={isSaving || Boolean(pendingPayload)} onChange={(event) => setResult(event.target.value as "pass" | "fail")} value={result}><option value="pass">Pass and close finding</option><option value="fail">Still needs work</option></select></label>
      <label className="field"><span>What did you check?</span><textarea disabled={isSaving || Boolean(pendingPayload)} onChange={(event) => setNotes(event.target.value)} required rows={2} value={notes} /></label>
      <label className="field"><span>Evidence (optional)</span><textarea disabled={isSaving || Boolean(pendingPayload)} onChange={(event) => setEvidenceNotes(event.target.value)} rows={2} value={evidenceNotes} /></label>
      {message ? <p role="alert">{message}</p> : null}
      <div className="modal-actions"><button className="secondary-action" disabled={isSaving} onClick={() => setIsOpen(false)} type="button">Close</button><button className="primary-action" disabled={isSaving || storageBlocked || !notes.trim()} type="submit">{isSaving ? "Saving…" : pendingPayload ? "Check retest" : "Record retest"}</button></div>
    </form> : <><button className="secondary-action" disabled={storageBlocked || isCheckingStatus || conflictState === "acknowledged"} type="button" onClick={conflictState === "unknown" ? checkStatus : conflictState === "not-found" ? startNewCheck : () => { setMessage(null); setIsOpen(true); }}>{isCheckingStatus ? "Checking status…" : conflictState === "acknowledged" ? "Retest accepted" : conflictState === "unknown" ? "Check status" : conflictState === "not-found" ? "Start a new check" : pendingPayload ? "Check retest" : "Record retest"}</button>{message ? <p role="status">{message}</p> : null}</> : null}
  </div>;
}
