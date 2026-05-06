import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { WorkstreamPayload } from "@/types/payloads";
import { WorkspaceColorField } from "../WorkspaceColorField";

interface WorkstreamEditorModalProps {
  activeWorkstreamId: string | null;
  bootstrap: BootstrapPayload;
  closeWorkstreamModal: () => void;
  handleToggleWorkstreamArchived: (workstreamId: string) => void;
  handleWorkstreamSubmit: (milestone: FormEvent<HTMLFormElement>) => void;
  isSavingWorkstream: boolean;
  setWorkstreamDraft: Dispatch<SetStateAction<WorkstreamPayload>>;
  workstreamDraft: WorkstreamPayload;
  workstreamModalMode: "create" | "edit";
}

export function WorkstreamEditorModal({
  activeWorkstreamId,
  bootstrap,
  closeWorkstreamModal,
  handleToggleWorkstreamArchived,
  handleWorkstreamSubmit,
  isSavingWorkstream,
  setWorkstreamDraft,
  workstreamDraft,
  workstreamModalMode,
}: WorkstreamEditorModalProps) {
  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section
        aria-modal="true"
        className="modal-card"
        role="dialog"
        style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--border-base)",
        }}
      >
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>
              Workflow editor
            </p>
            <h2 style={{ color: "var(--text-title)" }}>
              {workstreamModalMode === "create" ? "Add workflow" : "Edit workflow"}
            </h2>
          </div>
          <button
            className="icon-button"
            onClick={closeWorkstreamModal}
            style={{ color: "var(--text-copy)", background: "transparent" }}
            type="button"
          >
            Close
          </button>
        </div>
        <form
          className="modal-form"
          onSubmit={handleWorkstreamSubmit}
          style={{ color: "var(--text-copy)" }}
        >
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Name</span>
            <input
              onChange={(milestone) =>
                setWorkstreamDraft((current) => ({
                  ...current,
                  name: milestone.target.value,
                }))
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={workstreamDraft.name}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Project</span>
            <select
              onChange={(milestone) =>
                setWorkstreamDraft((current) => ({
                  ...current,
                  projectId: milestone.target.value,
                }))
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={workstreamDraft.projectId}
            >
              <option value="" disabled>
                Select project
              </option>
              {bootstrap.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Description</span>
            <textarea
              onChange={(milestone) =>
                setWorkstreamDraft((current) => ({
                  ...current,
                  description: milestone.target.value,
                }))
              }
              required
              rows={3}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={workstreamDraft.description}
            />
          </label>
          <WorkspaceColorField
            label="Workflow color"
            onChange={(color) =>
              setWorkstreamDraft((current) => ({
                ...current,
                color,
              }))
            }
            seed={`${workstreamDraft.projectId}:${workstreamDraft.name}:workflow`}
            value={workstreamDraft.color}
          />
          <div className="modal-actions modal-wide">
            {workstreamModalMode === "edit" && activeWorkstreamId ? (
              <button
                className={workstreamDraft.isArchived ? "secondary-action" : "danger-action"}
                disabled={isSavingWorkstream}
                onClick={() => handleToggleWorkstreamArchived(activeWorkstreamId)}
                type="button"
              >
                {workstreamDraft.isArchived ? "Restore workflow" : "Archive workflow"}
              </button>
            ) : null}
            <button
              className="secondary-action"
              onClick={closeWorkstreamModal}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              type="button"
            >
              Cancel
            </button>
            <button className="primary-action" disabled={isSavingWorkstream} type="submit">
              {isSavingWorkstream
                ? "Saving..."
                : workstreamModalMode === "create"
                  ? "Add workflow"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
