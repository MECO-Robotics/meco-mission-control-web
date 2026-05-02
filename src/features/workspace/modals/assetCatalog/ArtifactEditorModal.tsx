import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { ArtifactPayload, ArtifactStatus, BootstrapPayload } from "@/types";

interface ArtifactEditorModalProps {
  activeArtifactId: string | null;
  artifactDraft: ArtifactPayload;
  artifactModalMode: "create" | "edit";
  bootstrap: BootstrapPayload;
  closeArtifactModal: () => void;
  handleArtifactSubmit: (event: FormEvent<HTMLFormElement>) => void;
  handleDeleteArtifact: (artifactId: string) => Promise<void>;
  handleToggleArtifactArchived: (artifactId: string) => Promise<void>;
  isDeletingArtifact: boolean;
  isSavingArtifact: boolean;
  setArtifactDraft: Dispatch<SetStateAction<ArtifactPayload>>;
}

export function ArtifactEditorModal({
  activeArtifactId,
  artifactDraft,
  artifactModalMode,
  bootstrap,
  closeArtifactModal,
  handleArtifactSubmit,
  handleDeleteArtifact,
  handleToggleArtifactArchived,
  isDeletingArtifact,
  isSavingArtifact,
  setArtifactDraft,
}: ArtifactEditorModalProps) {
  const filteredWorkstreams = bootstrap.workstreams.filter(
    (workstream) => workstream.projectId === artifactDraft.projectId,
  );

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
              Artifact editor
            </p>
            <h2 style={{ color: "var(--text-title)" }}>
              {artifactModalMode === "create" ? "Add artifact" : "Edit artifact"}
            </h2>
          </div>
          <button
            className="icon-button"
            onClick={closeArtifactModal}
            style={{ color: "var(--text-copy)", background: "transparent" }}
            type="button"
          >
            Close
          </button>
        </div>
        <form
          className="modal-form"
          onSubmit={handleArtifactSubmit}
          style={{ color: "var(--text-copy)" }}
        >
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Title</span>
            <input
              onChange={(event) =>
                setArtifactDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={artifactDraft.title}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Project</span>
            <select
              onChange={(event) =>
                setArtifactDraft((current) => {
                  const projectId = event.target.value;
                  const defaultWorkstreamId =
                    bootstrap.workstreams.find(
                      (workstream) => workstream.projectId === projectId,
                    )?.id ?? null;
                  return {
                    ...current,
                    projectId,
                    workstreamId: defaultWorkstreamId,
                  };
                })
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={artifactDraft.projectId}
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
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Workflow</span>
            <select
              onChange={(event) =>
                setArtifactDraft((current) => ({
                  ...current,
                  workstreamId: event.target.value || null,
                }))
              }
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={artifactDraft.workstreamId ?? ""}
            >
              <option value="">Project-level artifact</option>
              {filteredWorkstreams.map((workstream) => (
                <option key={workstream.id} value={workstream.id}>
                  {workstream.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Status</span>
            <select
              onChange={(event) =>
                setArtifactDraft((current) => ({
                  ...current,
                  status: event.target.value as ArtifactStatus,
                }))
              }
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={artifactDraft.status}
            >
              <option value="draft">Draft</option>
              <option value="in-review">In review</option>
              <option value="published">Published</option>
            </select>
          </label>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Summary</span>
            <textarea
              onChange={(event) =>
                setArtifactDraft((current) => ({
                  ...current,
                  summary: event.target.value,
                }))
              }
              rows={3}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={artifactDraft.summary}
            />
          </label>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Link</span>
            <input
              onChange={(event) =>
                setArtifactDraft((current) => ({
                  ...current,
                  link: event.target.value,
                }))
              }
              placeholder="https://..."
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              type="url"
              value={artifactDraft.link}
            />
          </label>
          <div className="modal-actions modal-wide">
            {artifactModalMode === "edit" && activeArtifactId ? (
              <button
                className="danger-action"
                disabled={isDeletingArtifact || isSavingArtifact}
                onClick={() => {
                  void handleDeleteArtifact(activeArtifactId);
                }}
                type="button"
              >
                {isDeletingArtifact ? "Deleting..." : "Delete artifact"}
              </button>
            ) : null}
            {artifactModalMode === "edit" && activeArtifactId ? (
              <button
                className={artifactDraft.isArchived ? "secondary-action" : "danger-action"}
                disabled={isSavingArtifact || isDeletingArtifact}
                onClick={() => {
                  void handleToggleArtifactArchived(activeArtifactId);
                }}
                type="button"
              >
                {artifactDraft.isArchived ? "Restore artifact" : "Archive artifact"}
              </button>
            ) : null}
            <button
              className="secondary-action"
              onClick={closeArtifactModal}
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
              disabled={isSavingArtifact || isDeletingArtifact}
              type="submit"
            >
              {isSavingArtifact
                ? "Saving..."
                : artifactModalMode === "create"
                  ? "Add artifact"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
