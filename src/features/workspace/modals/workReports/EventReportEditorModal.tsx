import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TestResultPayload } from "@/types/payloads";
import { PhotoUploadField } from "@/features/workspace/shared/media/PhotoUploadField";

interface MilestoneReportEditorModalProps {
  bootstrap: BootstrapPayload;
  closeMilestoneReportModal: () => void;
  milestoneReportDraft: TestResultPayload;
  milestoneReportFindings: string;
  handleMilestoneReportSubmit: (milestone: FormEvent<HTMLFormElement>) => void;
  isSavingMilestoneReport: boolean;
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
  setMilestoneReportDraft: Dispatch<SetStateAction<TestResultPayload>>;
  setMilestoneReportFindings: (value: string) => void;
}

export function MilestoneReportEditorModal({
  bootstrap,
  closeMilestoneReportModal,
  milestoneReportDraft,
  milestoneReportFindings,
  handleMilestoneReportSubmit,
  isSavingMilestoneReport,
  requestPhotoUpload,
  setMilestoneReportDraft,
  setMilestoneReportFindings,
}: MilestoneReportEditorModalProps) {
  const selectedMilestone = bootstrap.milestones.find((item) => item.id === milestoneReportDraft.milestoneId);
  const milestoneReportPhotoProjectId =
    selectedMilestone?.projectIds[0] ?? bootstrap.projects[0]?.id ?? null;

  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section
        aria-modal="true"
        className="modal-card"
        role="dialog"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}
      >
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>
              Milestone report
            </p>
            <h2 style={{ color: "var(--text-title)" }}>Add milestone report</h2>
          </div>
          <button
            className="icon-button"
            onClick={closeMilestoneReportModal}
            style={{ color: "var(--text-copy)", background: "transparent" }}
            type="button"
          >
            Close
          </button>
        </div>
        <form
          className="modal-form"
          onSubmit={handleMilestoneReportSubmit}
          style={{ color: "var(--text-copy)" }}
        >
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Milestone</span>
            <select
              onChange={(milestone) =>
                setMilestoneReportDraft((current) => ({
                  ...current,
                  milestoneId: milestone.target.value,
                }))
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={milestoneReportDraft.milestoneId ?? ""}
            >
              <option disabled value="">
                Choose a milestone
              </option>
              {bootstrap.milestones.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            {selectedMilestone ? (
              <small style={{ color: "var(--text-copy)" }}>{selectedMilestone.description}</small>
            ) : null}
          </label>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Title</span>
            <input
              onChange={(milestone) =>
                setMilestoneReportDraft((current) => ({
                  ...current,
                  title: milestone.target.value,
                }))
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={milestoneReportDraft.title ?? ""}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Status</span>
            <select
              onChange={(milestone) =>
                setMilestoneReportDraft((current) => ({
                  ...current,
                  status: milestone.target.value as TestResultPayload["status"],
                }))
              }
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={milestoneReportDraft.status}
            >
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
              <option value="blocked">Blocked</option>
            </select>
          </label>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Findings (one per line)</span>
            <textarea
              onChange={(milestone) => setMilestoneReportFindings(milestone.target.value)}
              placeholder="Add findings from this milestone."
              rows={4}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={milestoneReportFindings}
            />
          </label>
          <PhotoUploadField
            accept="image/*,video/*"
            currentUrl={milestoneReportDraft.photoUrl}
            label="Milestone report media"
            onChange={(value) =>
              setMilestoneReportDraft((current) => ({ ...current, photoUrl: value }))
            }
            onUpload={async (file) => {
              if (!milestoneReportPhotoProjectId) {
                throw new Error("No project is available for photo upload.");
              }

              return requestPhotoUpload(milestoneReportPhotoProjectId, file);
            }}
          />
          <div className="modal-actions modal-wide">
            <button
              className="secondary-action"
              onClick={closeMilestoneReportModal}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              type="button"
            >
              Cancel
            </button>
            <button
              className="primary-action"
              disabled={isSavingMilestoneReport || bootstrap.milestones.length === 0}
              type="submit"
            >
              {isSavingMilestoneReport ? "Saving..." : "Add milestone report"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
