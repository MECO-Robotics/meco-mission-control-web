import { createPortal } from "react-dom";

import type { RiskRecord } from "@/types/recordsReporting";

import { ATTACHMENT_TYPE_LABELS, formatRiskSeverity, getRiskSeverityPillClassName } from "./riskViewModel";
import { TaskPriorityBadge } from "./taskQueue/taskQueueKanbanCardMeta";

interface RiskDetailsModalProps {
  activeRisk: RiskRecord;
  getAttachmentLabel: (risk: RiskRecord) => string;
  getMitigationLabel: (risk: RiskRecord) => string;
  getSourceLabel: (risk: RiskRecord) => string;
  onClose: () => void;
  onEditRisk: () => void;
}

export function RiskDetailsModal({
  activeRisk,
  getAttachmentLabel,
  getMitigationLabel,
  getSourceLabel,
  onClose,
  onEditRisk,
}: RiskDetailsModalProps) {
  const sourceTypeLabel = activeRisk.sourceType === "qa-report" ? "QA report" : "Test result";
  const riskPriority: "high" | "medium" | "low" = activeRisk.severity;

  if (typeof document === "undefined") {
    return null;
  }

  const modal = (
    <div
      className="modal-scrim"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      style={{ zIndex: 2050 }}
    >
      <section
        aria-modal="true"
        className="modal-card task-details-modal"
        role="dialog"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}
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
            <span style={{ color: "var(--text-title)" }}>Summary</span>
            <p className="task-detail-copy">{activeRisk.detail || "No risk detail provided."}</p>
          </div>
          <div className="field">
            <span style={{ color: "var(--text-title)" }}>Attachment</span>
            <p className="task-detail-copy">
              {ATTACHMENT_TYPE_LABELS[activeRisk.attachmentType]}: {getAttachmentLabel(activeRisk)}
            </p>
          </div>
          <div className="field">
            <span style={{ color: "var(--text-title)" }}>Mitigation task</span>
            <p className="task-detail-copy">{getMitigationLabel(activeRisk)}</p>
          </div>

          <div className="modal-actions modal-wide">
            <button className="primary-action" onClick={onEditRisk} type="button">
              Edit risk
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  return createPortal(modal, document.body);
}
