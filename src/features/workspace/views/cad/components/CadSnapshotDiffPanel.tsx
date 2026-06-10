import { useMemo } from "react";

import type { CadImportWarningRecord, CadSnapshotDiffStatus, OnshapeOverview } from "../model/cadIntegrationTypes";
import {
  getCadConfigurationLifecycleCopy,
  getCadConfigurationSourceCopy,
} from "@/features/workspace/shared/model/cadSourceModel";
import {
  buildCadSnapshotDiffViewModel,
  cadSnapshotDiffStatusLabels,
} from "../model/cadSnapshotDiffViewModel";

function WarningBadges({ warnings }: { warnings: CadImportWarningRecord[] }) {
  if (!warnings.length) {
    return null;
  }

  return (
    <span className="cad-diff-warning-stack">
      {warnings.map((warning) => (
        <span className="cad-diff-warning-badge" data-severity={warning.severity} key={warning.id}>
          {warning.title}
        </span>
      ))}
    </span>
  );
}

export function CadSnapshotDiffPanel({ overview }: { overview: OnshapeOverview | null }) {
  const viewModel = useMemo(() => buildCadSnapshotDiffViewModel(overview), [overview]);
  const hasSnapshot = viewModel.currentSnapshot !== null;
  const sourceCopy = hasSnapshot ? getCadConfigurationSourceCopy(viewModel.currentSnapshot?.source ?? "ONSHAPE_API") : null;
  const lifecycleCopy = hasSnapshot
    ? getCadConfigurationLifecycleCopy({
        immutable: viewModel.currentSnapshot?.immutable ?? null,
        status: "preview",
      })
    : null;

  return (
    <section className="cad-card cad-snapshot-diff-card" aria-labelledby="cad-snapshot-diff-title">
      <div className="cad-section-heading cad-snapshot-diff-heading">
        <div>
          <span className="cad-eyebrow">Snapshot diff</span>
          <h3 id="cad-snapshot-diff-title">Onshape change preview</h3>
        </div>
        <span className="cad-preview-pill">{lifecycleCopy?.label ?? "Not started"}</span>
      </div>
      <p className="cad-diff-context">
        {viewModel.currentSnapshot
          ? `Comparing ${viewModel.currentSnapshot.label} against ${viewModel.previousSnapshot?.label ?? "an empty baseline"}.`
          : "Run BOM Sync to create a CAD snapshot before previewing changes."}
      </p>
      {sourceCopy && lifecycleCopy ? (
        <p className="cad-source-model-copy">
          Source: {sourceCopy.label}. {lifecycleCopy.detail}
        </p>
      ) : null}
      <div className="cad-diff-counts" aria-label="CAD snapshot diff counts">
        {(Object.keys(cadSnapshotDiffStatusLabels) as CadSnapshotDiffStatus[]).map((status) => (
          <span className="cad-diff-count" data-status={status} key={status}>
            <strong>{viewModel.counts[status]}</strong>
            {cadSnapshotDiffStatusLabels[status]}
          </span>
        ))}
      </div>

      {viewModel.snapshotWarnings.length ? (
        <div className="cad-diff-snapshot-warnings" aria-label="Snapshot diff warnings">
          {viewModel.snapshotWarnings.map((warning) => (
            <article className="cad-warning-item" data-severity={warning.severity} key={warning.id}>
              <strong>{warning.title}</strong>
              <span>{warning.message}</span>
              <code>{warning.code}</code>
            </article>
          ))}
        </div>
      ) : null}

      {viewModel.groups.length ? (
        <div className="cad-diff-tree">
          {viewModel.groups.map((subsystem) => (
            <section className="cad-diff-group" key={subsystem.label}>
              <h4>
                {subsystem.label}
                <WarningBadges warnings={subsystem.warnings} />
              </h4>
              {subsystem.mechanisms.map((mechanism) => (
                <div className="cad-diff-mechanism" key={mechanism.label}>
                  <h5>
                    {mechanism.label}
                    <WarningBadges warnings={mechanism.warnings} />
                  </h5>
                  {mechanism.parts.map((part) => (
                    <div className="cad-diff-part" key={part.label}>
                      <div className="cad-diff-part-title">
                        <strong>{part.label}</strong>
                        <WarningBadges warnings={part.warnings} />
                      </div>
                      <ul className="cad-diff-record-list">
                        {part.items.map((item) => (
                          <li className="cad-diff-record" data-status={item.status} key={item.id}>
                            <span className="cad-diff-status">{cadSnapshotDiffStatusLabels[item.status]}</span>
                            <span>
                              <strong>{item.label}</strong>
                              <small>{item.detail}</small>
                              {item.changedFields.length ? <small>Changed: {item.changedFields.join(", ")}</small> : null}
                            </span>
                            <WarningBadges warnings={item.warnings} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </section>
          ))}
        </div>
      ) : (
        <p className="cad-empty-copy">No CAD-derived records are available for this preview.</p>
      )}
    </section>
  );
}
