import { EditorModalShell } from "@/features/workspace/modals/EditorModalShell";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { ArtifactPayload } from "@/types/payloads";
import type { ArtifactStatus } from "@/types/common";
import type { BootstrapPayload } from "@/types/bootstrap";
import { PhotoUploadField } from "@/features/workspace/shared/media/PhotoUploadField";

interface ArtifactEditorModalProps {
  activeArtifactId: string | null;
  artifactDraft: ArtifactPayload;
  artifactModalMode: "create" | "edit";
  bootstrap: BootstrapPayload;
  closeArtifactModal: () => void;
  handleArtifactSubmit: (milestone: FormEvent<HTMLFormElement>) => void;
  handleDeleteArtifact: (artifactId: string) => Promise<void>;
  isDeletingArtifact: boolean;
  isSavingArtifact: boolean;
  setArtifactDraft: Dispatch<SetStateAction<ArtifactPayload>>;
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
}

export function ArtifactEditorModal({
  activeArtifactId,
  artifactDraft,
  artifactModalMode,
  bootstrap,
  closeArtifactModal,
  handleArtifactSubmit,
  handleDeleteArtifact,
  isDeletingArtifact,
  isSavingArtifact,
  setArtifactDraft,
  requestPhotoUpload,
}: ArtifactEditorModalProps) {
  const targets = [
    ...bootstrap.tasks.map((x) => ({ kind: "task" as const, id: x.id, label: `Task · ${x.title}` })),
    ...bootstrap.subsystems.map((x) => ({ kind: "subsystem" as const, id: x.id, label: `Subsystem · ${x.name}` })),
    ...bootstrap.mechanisms.map((x) => ({ kind: "mechanism" as const, id: x.id, label: `Mechanism · ${x.name}` })),
    ...bootstrap.partDefinitions.map((x) => ({ kind: "part-definition" as const, id: x.id, label: `Part · ${x.name}` })),
    ...bootstrap.meetings.map((x) => ({ kind: "meeting" as const, id: x.id, label: `Meeting · ${x.title}` })),
    ...bootstrap.events.map((x) => ({ kind: "event" as const, id: x.id, label: `Event · ${x.title}` })),
    ...bootstrap.milestones.map((x) => ({ kind: "milestone" as const, id: x.id, label: `Milestone · ${x.title}` })),
    ...bootstrap.projects.map((x) => ({ kind: "project" as const, id: x.id, label: `Project · ${x.name}` })),
  ];

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
              return {
                ...current,
                projectId,
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
      <label className="field modal-wide">
        <span style={{ color: "var(--text-title)" }}>Linked domain record</span>
        <select onChange={(event) => {
          const [kind, id] = event.target.value.split(":");
          if (!kind || !id) return;
          setArtifactDraft((current) => current.targetRefs.some((ref) => ref.kind === kind && ref.id === id) ? current : { ...current, targetRefs: [...current.targetRefs, { kind, id } as (typeof current.targetRefs)[number]] });
        }} value="">
          <option value="">Add a linked record…</option>
          {targets.map((target) => <option key={`${target.kind}:${target.id}`} value={`${target.kind}:${target.id}`}>{target.label}</option>)}
        </select>
        <span>{artifactDraft.targetRefs.map((ref) => <button key={`${ref.kind}:${ref.id}`} className="secondary-action" type="button" onClick={() => setArtifactDraft((current) => ({ ...current, targetRefs: current.targetRefs.filter((item) => item.kind !== ref.kind || item.id !== ref.id) }))}>{ref.kind} · {ref.id} ×</button>)}</span>
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
        <span style={{ color: "var(--text-title)" }}>Document URI</span>
        <input
          onChange={(milestone) =>
            setArtifactDraft((current) => ({
              ...current,
              uri: milestone.target.value,
            }))
          }
          placeholder="https://..."
          type="url"
          value={artifactDraft.uri}
        />
      </label>
      <PhotoUploadField
        currentUrl={artifactDraft.photoUrl ?? ""}
        label="Document photo"
        onChange={(value) => setArtifactDraft((current) => ({ ...current, photoUrl: value }))}
        onUpload={(file) => {
          const projectId = artifactDraft.projectId || bootstrap.projects[0]?.id;
          if (!projectId) return Promise.reject(new Error("Select a project before uploading a photo."));
          return requestPhotoUpload(projectId, file);
        }}
      />
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
