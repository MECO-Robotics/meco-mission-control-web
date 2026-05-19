import { useMemo, useState, type FormEvent } from "react";
import { Link, RefreshCw, UploadCloud } from "lucide-react";

import {
  createOnshapeDocumentRef,
  fetchOnshapeOverview,
  runOnshapeImport,
} from "@/features/workspace/views/cad/api/onshapeCadApi";
import { parseOnshapeUrl } from "@/features/workspace/views/cad/model/onshapeUrlParser";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import type { BootstrapPayload } from "@/types/bootstrap";

import { PartMappingChangeList } from "./PartMappingChangeList";
import { buildPartMappingChanges } from "./partMappingSyncModel";
import type { PartMappingChange, PartMappingDecision } from "./partMappingSyncTypes";
import "./partMappingSync.css";
import "./partMappingSyncReview.css";

function countByDecision(changes: PartMappingChange[]) {
  return changes.reduce(
    (counts, change) => ({
      approved: counts.approved + (change.decision === "approved" ? 1 : 0),
      denied: counts.denied + (change.decision === "denied" ? 1 : 0),
    }),
    { approved: 0, denied: 0 },
  );
}

function countByKind(changes: PartMappingChange[], kind: PartMappingChange["kind"]) {
  return changes.filter((change) => change.kind === kind).length;
}

export function PartMappingSyncView({
  applyPartMappingChanges,
  bootstrap,
  selectedSeasonId,
}: {
  applyPartMappingChanges: (changes: PartMappingChange[]) => Promise<boolean>;
  bootstrap: BootstrapPayload;
  selectedSeasonId: string | null;
}) {
  const [linkUrl, setLinkUrl] = useState("");
  const [label, setLabel] = useState("Robot master assembly");
  const [changes, setChanges] = useState<PartMappingChange[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const parsedUrl = useMemo(() => (linkUrl.trim() ? parseOnshapeUrl(linkUrl.trim()) : null), [linkUrl]);
  const counts = useMemo(() => countByDecision(changes), [changes]);
  const hasReview = changes.length > 0;

  const resetDecisions = () => {
    setChanges((current) =>
      current.map((change) => ({
        ...change,
        decision: change.kind === "deleted-instance" || change.kind === "archived-part" ? "denied" : "approved",
      })),
    );
  };

  const setDecision = (changeId: string, decision: PartMappingDecision) => {
    setChanges((current) =>
      current.map((change) => (change.id === changeId ? { ...change, decision } : change)),
    );
  };

  const handleSync = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!parsedUrl?.ok) {
      setMessage("Paste a valid Onshape link before syncing.");
      return;
    }

    setIsSyncing(true);
    setMessage(null);
    try {
      const savedRef = await createOnshapeDocumentRef({
        url: parsedUrl.originalUrl,
        label,
        projectId: bootstrap.projects[0]?.id ?? null,
        seasonId: selectedSeasonId,
      });
      await runOnshapeImport({ documentRefId: savedRef.item.id, syncLevel: "bom" });
      const overview = await fetchOnshapeOverview();
      const nextChanges = buildPartMappingChanges({
        bootstrap,
        selectedSeasonId,
        source: overview,
      });
      setChanges(nextChanges);
      setMessage(`${nextChanges.length} mapping changes ready for review.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApply = async () => {
    setIsApplying(true);
    setMessage(null);
    try {
      const didApply = await applyPartMappingChanges(changes);
      if (didApply) {
        setChanges([]);
        setMessage("Approved mapping changes applied.");
      }
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <section className={`panel dense-panel part-sync-shell ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Part mapping sync</h2>
          <p className="section-copy">
            Review CAD-driven changes before Mission Control updates subsystem, mechanism, and part mappings.
          </p>
        </div>
      </div>

      {message ? <div className="part-sync-message" role="status">{message}</div> : null}

      <div className="part-sync-grid">
        <form className="part-sync-link-panel" onSubmit={handleSync}>
          <span className="part-sync-eyebrow">Source link</span>
          <label className="part-sync-field">
            <span>Label</span>
            <input value={label} onChange={(event) => setLabel(event.target.value)} />
          </label>
          <label className="part-sync-field">
            <span>Onshape assembly link</span>
            <textarea
              onChange={(event) => setLinkUrl(event.target.value)}
              placeholder="https://cad.onshape.com/documents/..."
              rows={4}
              value={linkUrl}
            />
          </label>
          {parsedUrl?.errors.length ? <p className="part-sync-warning">{parsedUrl.errors.join(" ")}</p> : null}
          <button className="primary-action part-sync-action" disabled={isSyncing} type="submit">
            {isSyncing ? <RefreshCw size={16} /> : <Link size={16} />}
            {isSyncing ? "Syncing..." : "Sync mapping"}
          </button>
        </form>

        <section className="part-sync-summary-panel">
          <span className="part-sync-eyebrow">Review state</span>
          <div className="part-sync-metrics">
            <strong>{changes.length}</strong>
            <span>pending changes</span>
          </div>
          <dl className="part-sync-counts">
            <div><dt>Approved</dt><dd>{counts.approved}</dd></div>
            <div><dt>Denied</dt><dd>{counts.denied}</dd></div>
            <div><dt>New parts</dt><dd>{countByKind(changes, "new-part")}</dd></div>
            <div><dt>Iterations</dt><dd>{countByKind(changes, "new-iteration")}</dd></div>
            <div><dt>Deletes</dt><dd>{countByKind(changes, "deleted-instance")}</dd></div>
          </dl>
          <button
            className="primary-action part-sync-action"
            disabled={!hasReview || isApplying || counts.approved === 0}
            onClick={handleApply}
            type="button"
          >
            <UploadCloud size={16} />
            {isApplying ? "Applying..." : "Apply approved"}
          </button>
        </section>
      </div>

      <PartMappingChangeList
        changes={changes}
        onDecisionChange={setDecision}
        onResetDecisions={resetDecisions}
      />
    </section>
  );
}
