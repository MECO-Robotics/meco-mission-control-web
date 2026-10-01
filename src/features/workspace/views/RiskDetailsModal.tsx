import { ModalDialog } from "@/components/ModalDialog";
import { createPortal } from "react-dom";

import type { AuditActionRecord } from "@/types/recordsExecution";
import type { RiskRecord } from "@/types/recordsReporting";
import { WorkspaceAuditActionList } from "@/features/workspace/shared/WorkspaceAuditActionList";

import { formatRiskSeverity, getRiskSeverityPillClassName } from "./riskViewData/riskViewDataPayload";
import { getRiskScheduleMilestoneId } from "./riskViewData/riskViewDataLookups";
import { TaskPriorityBadge } from "./taskQueue/taskQueueKanbanCardMeta";

interface RiskDetailsModalProps {
  activeRisk: RiskRecord;
  auditActions?: AuditActionRecord[];
  getTargetLabel: (target: RiskRecord["relatedTargets"][number]) => string;
  getMitigationLabel: (risk: RiskRecord) => string;
  getSourceLabel: (risk: RiskRecord) => string;
  onClose: () => void;
  onEditRisk: () => void;
  onOpenSchedule?: (milestoneId: string) => void;
}

export function RiskDetailsModal({
  activeRisk,
  auditActions = [],
  getTargetLabel,
  getMitigationLabel,
  getSourceLabel,
  onClose,
  onEditRisk,
  onOpenSchedule,
}: RiskDetailsModalProps) {
  const sourceTypeLabel = activeRisk.source.kind === "manual" ? "Manual" : activeRisk.source.kind;
  const riskPriority = activeRisk.severity;
  const scheduleMilestoneId = getRiskScheduleMilestoneId(activeRisk);

  if (typeof document === "undefined") {
    return null;
  }

  const modal = (
    <ModalDialog label={activeRisk.title} onClose={onClose} dismissOnBackdrop>
      <section
        className="modal-card task-details-modal modal-panel-surface"
      >
        <div className="panel-header compact-header task-details-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--official-red)" }}>
              View Risk Details
            </p>
            <h2>{activeRisk.title}</h2>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.45rem", marginTop: "0.35rem" }}>
              <span
                aria-label="Risk severity"
                className={getRiskSeverityPillClassName(activeRisk.severity)}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.32rem" }}
              >
                <span aria-hidden="true" className="task-queue-board-column-header-icon">
                  <TaskPriorityBadge priority={riskPriority} />
                </span>
                <span className="task-queue-board-column-header-label">{formatRiskSeverity(activeRisk.severity)}</span>
              </span>
              <span style={{ color: "var(--text-copy)" }}>from</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--text-copy)" }}>
                <span className="pill status-pill status-pill-neutral">{sourceTypeLabel}</span>
                <span>{getSourceLabel(activeRisk)}</span>
              </span>
            </div>
          </div>
          <div className="panel-actions">
            <button className="icon-button task-details-close-button" onClick={onClose} type="button">
              {"\u00D7"}
            </button>
          </div>
        </div>

        <div className="modal-form task-details-grid" style={{ color: "var(--text-copy)" }}>
          <div className="field modal-wide">
            <span>Summary</span>
            <p className="task-detail-copy">{activeRisk.detail || "No risk detail provided."}</p>
          </div>
          {scheduleMilestoneId && onOpenSchedule ? <div className="modal-actions modal-wide">
            <button className="secondary-action" onClick={() => onOpenSchedule(scheduleMilestoneId)} type="button">Open milestone in Schedule</button>
          </div> : null}
          <div className="field">
            <span>Related domain records</span>
            <p className="task-detail-copy">
              {activeRisk.relatedTargets.map(getTargetLabel).join(", ") || "No related targets"}
            </p>
          </div>
          <div className="field">
            <span>Mitigation task</span>
            <p className="task-detail-copy">{getMitigationLabel(activeRisk)}</p>
          </div>
          <div className="field modal-wide">
            <span>Risk ownership</span>
            <p className="task-detail-copy">
              {activeRisk.blocksWork ? "This unresolved risk blocks work." : "This risk is tracked without blocking work."}
            </p>
          </div>
          <WorkspaceAuditActionList
            actions={auditActions}
            emptyText="No risk reassessment audit actions are recorded yet."
          />

          <div className="modal-actions modal-wide">
            <button className="primary-action" onClick={onEditRisk} type="button">
              Edit risk
            </button>
          </div>
        </div>
      </section>
    </ModalDialog>
  );

  return createPortal(modal, document.body);
}
