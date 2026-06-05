import type { Dispatch, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { QaReportPayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { formatRiskSeverity, getRiskSeverityPillClassName } from "@/features/workspace/views/riskViewModel";

interface QaRiskReassessmentSectionProps {
  bootstrap: BootstrapPayload;
  qaReportDraft: QaReportPayload;
  selectedTask?: TaskRecord;
  setQaReportDraft: Dispatch<SetStateAction<QaReportPayload>>;
}

const selectStyle = {
  background: "var(--bg-row-alt)",
  border: "1px solid var(--border-base)",
  color: "var(--text-title)",
};

export function QaRiskReassessmentSection({
  bootstrap,
  qaReportDraft,
  selectedTask,
  setQaReportDraft,
}: QaRiskReassessmentSectionProps) {
  const selectedRisk = bootstrap.risks.find((risk) => risk.id === qaReportDraft.targetRiskId);
  const taskRiskOptions = bootstrap.risks.filter(
    (risk) =>
      !selectedTask ||
      risk.id === selectedTask.targetRiskId ||
      risk.mitigationTaskId === selectedTask.id,
  );
  const visibleRiskOptions = taskRiskOptions.length > 0 ? taskRiskOptions : bootstrap.risks;
  const proposedStatusLabel =
    qaReportDraft.proposedRiskStatus === "full-mitigation"
      ? "Full mitigation"
      : "Partial mitigation";

  return (
    <div className="field modal-wide">
      <span style={{ color: "var(--text-title)" }}>Risk reassessment</span>
      <div className="task-details-section-grid">
        <label className="field">
          <span style={{ color: "var(--text-title)" }}>Target risk</span>
          <select
            onChange={(milestone) =>
              setQaReportDraft((current) => ({
                ...current,
                targetRiskId: milestone.target.value || null,
                proposedRiskSeverity: milestone.target.value
                  ? (current.proposedRiskSeverity ??
                    bootstrap.risks.find((risk) => risk.id === milestone.target.value)?.severity ??
                    null)
                  : null,
                proposedRiskStatus: milestone.target.value
                  ? (current.proposedRiskStatus ?? "partial-mitigation")
                  : null,
              }))
            }
            style={selectStyle}
            value={qaReportDraft.targetRiskId ?? ""}
          >
            <option value="">No risk reassessment</option>
            {visibleRiskOptions.map((risk) => (
              <option key={risk.id} value={risk.id}>
                {risk.title} ({formatRiskSeverity(risk.severity)})
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span style={{ color: "var(--text-title)" }}>Proposed severity</span>
          <select
            disabled={!qaReportDraft.targetRiskId}
            onChange={(milestone) =>
              setQaReportDraft((current) => ({
                ...current,
                proposedRiskSeverity: milestone.target.value as QaReportPayload["proposedRiskSeverity"],
              }))
            }
            style={selectStyle}
            value={qaReportDraft.proposedRiskSeverity ?? selectedRisk?.severity ?? ""}
          >
            <option value="">No severity change</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label className="field">
          <span style={{ color: "var(--text-title)" }}>Mitigation result</span>
          <select
            disabled={!qaReportDraft.targetRiskId}
            onChange={(milestone) =>
              setQaReportDraft((current) => ({
                ...current,
                proposedRiskSeverity:
                  milestone.target.value === "full-mitigation"
                    ? "low"
                    : current.proposedRiskSeverity,
                proposedRiskStatus: milestone.target.value as QaReportPayload["proposedRiskStatus"],
              }))
            }
            style={selectStyle}
            value={qaReportDraft.proposedRiskStatus ?? ""}
          >
            <option value="">No status proposal</option>
            <option value="partial-mitigation">Partial mitigation</option>
            <option value="full-mitigation">Full mitigation</option>
          </select>
        </label>
      </div>
      {selectedRisk ? (
        <small style={{ color: "var(--text-copy)" }}>
          Current risk is{" "}
          <span className={getRiskSeverityPillClassName(selectedRisk.severity)}>
            {formatRiskSeverity(selectedRisk.severity)}
          </span>
          . {proposedStatusLabel} is recorded on this QA report; the risk severity changes only
          when mentor approved is checked.
        </small>
      ) : (
        <small style={{ color: "var(--text-copy)" }}>
          Partial mitigation means the risk remains open at a lower severity. Full mitigation
          means QA proposes reducing the tracked risk to low after mentor review.
        </small>
      )}
    </div>
  );
}
