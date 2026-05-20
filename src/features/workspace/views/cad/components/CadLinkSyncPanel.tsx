import type { FormEvent } from "react";
import type { OnshapeDocumentRefRecord, OnshapeUrlParseResult, SyncLevel } from "../model/cadIntegrationTypes";

const syncLevels: Array<{ value: SyncLevel; label: string }> = [
  { value: "link_only", label: "Link Only" },
  { value: "shallow", label: "Shallow Sync" },
  { value: "bom", label: "BOM Sync" },
  { value: "deep_release", label: "Deep Release Sync" },
];

function PreviewRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || "not present"}</dd>
    </div>
  );
}

export function CadLinkSyncPanel({
  documentRefs,
  isSaving,
  isSyncing,
  label,
  onLabelChange,
  onSave,
  onSelectDocumentRef,
  onSync,
  onSyncLevelChange,
  onUrlChange,
  parsedUrl,
  selectedDocumentRefId,
  syncLevel,
  url,
}: {
  documentRefs: OnshapeDocumentRefRecord[];
  isSaving: boolean;
  isSyncing: boolean;
  label: string;
  onLabelChange: (value: string) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onSelectDocumentRef: (value: string) => void;
  onSync: () => void;
  onSyncLevelChange: (value: SyncLevel) => void;
  onUrlChange: (value: string) => void;
  parsedUrl: OnshapeUrlParseResult | null;
  selectedDocumentRefId: string;
  syncLevel: SyncLevel;
  url: string;
}) {
  const immutable = parsedUrl?.referenceType === "version" || parsedUrl?.referenceType === "microversion";

  return (
    <div className="cad-grid cad-grid-two">
      <form className="cad-card cad-link-card" onSubmit={onSave}>
        <span className="cad-eyebrow">Link Onshape</span>
        <h3>Paste document or assembly URL</h3>
        <label className="cad-field">
          <span>Label</span>
          <input value={label} onChange={(event) => onLabelChange(event.target.value)} placeholder="Robot master assembly" />
        </label>
        <label className="cad-field">
          <span>Onshape URL</span>
          <textarea value={url} onChange={(event) => onUrlChange(event.target.value)} placeholder="https://cad.onshape.com/documents/..." rows={4} />
        </label>
        <button className="primary-button" disabled={!parsedUrl?.ok || isSaving} type="submit">
          {isSaving ? "Saving link..." : "Save link"}
        </button>
      </form>

      <article className="cad-card cad-preview-card">
        <span className="cad-eyebrow">Parsed URL preview</span>
        <h3>{parsedUrl?.ok ? "Ready to store" : "Waiting for a valid Onshape URL"}</h3>
        <dl className="cad-key-values">
          <PreviewRow label="documentId" value={parsedUrl?.documentId} />
          <PreviewRow label="workspaceId" value={parsedUrl?.workspaceId} />
          <PreviewRow label="versionId" value={parsedUrl?.versionId} />
          <PreviewRow label="microversionId" value={parsedUrl?.microversionId} />
          <PreviewRow label="elementId" value={parsedUrl?.elementId} />
          <PreviewRow label="Reference" value={parsedUrl?.referenceType} />
          <PreviewRow label="Immutable" value={parsedUrl ? (immutable ? "yes" : "no") : "unknown"} />
        </dl>
        {parsedUrl?.errors.length ? <p className="cad-warning-copy">{parsedUrl.errors.join(" ")}</p> : null}
      </article>

      <article className="cad-card cad-sync-card">
        <span className="cad-eyebrow">Manual sync</span>
        <h3>Explicit sync only</h3>
        <label className="cad-field">
          <span>Saved reference</span>
          <select value={selectedDocumentRefId} onChange={(event) => onSelectDocumentRef(event.target.value)}>
            <option value="">Select a saved Onshape link</option>
            {documentRefs.map((ref) => <option key={ref.id} value={ref.id}>{ref.label}</option>)}
          </select>
        </label>
        <label className="cad-field">
          <span>Sync level</span>
          <select value={syncLevel} onChange={(event) => onSyncLevelChange(event.target.value as SyncLevel)}>
            {syncLevels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
          </select>
        </label>
        <button className="secondary-button" disabled={!selectedDocumentRefId || isSyncing} onClick={onSync} type="button">
          {isSyncing ? "Syncing..." : "Run selected sync"}
        </button>
      </article>
    </div>
  );
}
