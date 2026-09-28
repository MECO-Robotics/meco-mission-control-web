import { EditorModalShell } from "@/features/workspace/modals/EditorModalShell";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { ArtifactPayload } from "@/types/payloads";
import type { ArtifactStatus } from "@/types/common";
import type { BootstrapPayload } from "@/types/bootstrap";

interface ArtifactEditorModalProps {
  activeArtifactId: string | null;
  artifactDraft: ArtifactPayload;
  artifactModalMode: "create" | "edit";
  bootstrap: BootstrapPayload;
  closeArtifactModal: () => void;
  handleArtifactSubmit: (milestone: FormEvent<HTMLFormElement>) => void;
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
    <EditorModalShell
      dialogLabel="Artifact editor"
      eyebrowLabel="Artifact editor"
      title={artifactModalMode === "create" ? "Add artifact" : "Edit artifact"}
      onClose={closeArtifactModal}
      onSubmit={handleArtifactSubmit}
    >
      <label className="field modal-wide">
        <span style={{ color: "var(--text-title)" }}>Title</span>
        <input
          onChange={(milestone) =>
            setArtifactDraft((current) => ({
              ...current,
              title: milestone.target.value,
            }))
          }
          required
          value={artifactDraft.title}
        />
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Project</span>
        <select
          onChange={(milestone) =>
            setArtifactDraft((current) => {
              const projectId = milestone.target.value;
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
          onChange={(milestone) =>
            setArtifactDraft((current) => ({
              ...current,
              workstreamId: milestone.target.value || null,
            }))
          }
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
          onChange={(milestone) =>
            setArtifactDraft((current) => ({
              ...current,
              status: milestone.target.value as ArtifactStatus,
            }))
          }
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
          onChange={(milestone) =>
            setArtifactDraft((current) => ({
              ...current,
              summary: milestone.target.value,
            }))
          }
          rows={3}
          value={artifactDraft.summary}
        />
      </label>
      <label className="field modal-wide">
        <span style={{ color: "var(--text-title)" }}>Link</span>
        <input
          onChange={(milestone) =>
            setArtifactDraft((current) => ({
              ...current,
              link: milestone.target.value,
            }))
          }
          placeholder="https://..."
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
    </EditorModalShell>
  );
}
