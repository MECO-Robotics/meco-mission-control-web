import type { Dispatch, FormEvent, SetStateAction } from "react";
import type {
  ArtifactPayload,
  ArtifactStatus,
  BootstrapPayload,
  MaterialPayload,
  PartDefinitionPayload,
  PartInstancePayload,
  WorkstreamPayload,
} from "@/types";
import { buildIterationOptions, formatIterationVersion } from "@/lib/appUtils";
import { PhotoUploadField } from "@/features/workspace/shared/PhotoUploadField";
import { WorkspaceColorField } from "./WorkspaceColorField";

interface MaterialEditorModalProps {
  closeMaterialModal: () => void;
  handleDeleteMaterial: (id: string) => void;
  handleMaterialSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isDeletingMaterial: boolean;
  isSavingMaterial: boolean;
  materialDraft: MaterialPayload;
  materialModalMode: "create" | "edit";
  activeMaterialId: string | null;
  setMaterialDraft: Dispatch<SetStateAction<MaterialPayload>>;
}

export function MaterialEditorModal({
  closeMaterialModal,
  handleDeleteMaterial,
  handleMaterialSubmit,
  isDeletingMaterial,
  isSavingMaterial,
  materialDraft,
  materialModalMode,
  activeMaterialId,
  setMaterialDraft,
}: MaterialEditorModalProps) {
  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section aria-modal="true" className="modal-card" role="dialog" style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}>
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>Material editor</p>
            <h2 style={{ color: "var(--text-title)" }}>{materialModalMode === "create" ? "Add material" : "Edit material"}</h2>
          </div>
          <button className="icon-button" onClick={closeMaterialModal} type="button" style={{ color: "var(--text-copy)", background: "transparent" }}>Close</button>
        </div>
        <form className="modal-form" onSubmit={handleMaterialSubmit} style={{ color: "var(--text-copy)" }}>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Name</span>
            <input onChange={(event) => setMaterialDraft((current) => ({ ...current, name: event.target.value }))} required style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={materialDraft.name} />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Category</span>
            <select onChange={(event) => setMaterialDraft((current) => ({ ...current, category: event.target.value as MaterialPayload["category"] }))} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={materialDraft.category}>
              <option value="metal">Metal</option>
              <option value="plastic">Plastic</option>
              <option value="filament">Filament</option>
              <option value="electronics">Electronics</option>
              <option value="hardware">Hardware</option>
              <option value="consumable">Consumable</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>On hand</span>
            <input
              min="0"
              onChange={(event) => {
                const onHandQuantity = Number(event.target.value);
                setMaterialDraft((current) => ({
                  ...current,
                  onHandQuantity,
                  reorderPoint:
                    materialModalMode === "create"
                      ? Math.floor(onHandQuantity / 2)
                      : current.reorderPoint,
                }));
              }}
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              type="number"
              value={materialDraft.onHandQuantity}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Reorder point</span>
            <input
              disabled={materialModalMode === "create"}
              min="0"
              onChange={(event) =>
                setMaterialDraft((current) => ({
                  ...current,
                  reorderPoint: Number(event.target.value),
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              type="number"
              value={materialDraft.reorderPoint}
            />
            {materialModalMode === "create" ? (
              <small style={{ color: "var(--text-copy)" }}>
                Auto-set to 50% of on-hand quantity while adding.
              </small>
            ) : null}
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Location</span>
            <input onChange={(event) => setMaterialDraft((current) => ({ ...current, location: event.target.value }))} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={materialDraft.location} />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Vendor</span>
            <input onChange={(event) => setMaterialDraft((current) => ({ ...current, vendor: event.target.value }))} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={materialDraft.vendor} />
          </label>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Notes</span>
            <textarea onChange={(event) => setMaterialDraft((current) => ({ ...current, notes: event.target.value }))} rows={3} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={materialDraft.notes} />
          </label>
          <div className="modal-actions modal-wide">
            {materialModalMode === "edit" && activeMaterialId ? (
              <button
                className="danger-action"
                disabled={isDeletingMaterial || isSavingMaterial}
                onClick={() => handleDeleteMaterial(activeMaterialId)}
                type="button"
              >
                {isDeletingMaterial ? "Deleting..." : "Delete material"}
              </button>
            ) : null}
            <button className="secondary-action" onClick={closeMaterialModal} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} type="button">Cancel</button>
            <button className="primary-action" disabled={isSavingMaterial} type="submit">{isSavingMaterial ? "Saving..." : materialModalMode === "create" ? "Add material" : "Save changes"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

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

interface WorkstreamEditorModalProps {
  activeWorkstreamId: string | null;
  bootstrap: BootstrapPayload;
  closeWorkstreamModal: () => void;
  handleToggleWorkstreamArchived: (workstreamId: string) => void;
  handleWorkstreamSubmit: (event: FormEvent<HTMLFormElement>) => void;
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
              onChange={(event) =>
                setWorkstreamDraft((current) => ({
                  ...current,
                  name: event.target.value,
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
              onChange={(event) =>
                setWorkstreamDraft((current) => ({
                  ...current,
                  projectId: event.target.value,
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
              onChange={(event) =>
                setWorkstreamDraft((current) => ({
                  ...current,
                  description: event.target.value,
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

interface PartDefinitionEditorModalProps {
  bootstrap: BootstrapPayload;
  activePartDefinitionId: string | null;
  closePartDefinitionModal: () => void;
  handleDeletePartDefinition: (id: string) => void;
  handleTogglePartDefinitionArchived: (id: string) => void;
  handlePartDefinitionSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isDeletingPartDefinition: boolean;
  isSavingPartDefinition: boolean;
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
  partDefinitionDraft: PartDefinitionPayload;
  partDefinitionModalMode: "create" | "edit";
  setPartDefinitionDraft: Dispatch<SetStateAction<PartDefinitionPayload>>;
}
export function PartDefinitionEditorModal({
  bootstrap,
  activePartDefinitionId,
  closePartDefinitionModal,
  handleDeletePartDefinition,
  handleTogglePartDefinitionArchived,
  handlePartDefinitionSubmit,
  isDeletingPartDefinition,
  isSavingPartDefinition,
  requestPhotoUpload,
  partDefinitionDraft,
  partDefinitionModalMode,
  setPartDefinitionDraft,
}: PartDefinitionEditorModalProps) {
  const partDefinitionIterationOptions = buildIterationOptions(
    bootstrap.partDefinitions.map((partDefinition) => partDefinition.iteration),
    partDefinitionDraft.iteration,
  );
  const partDefinitionPhotoProjectId = bootstrap.projects[0]?.id ?? null;

  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section aria-modal="true" className="modal-card" role="dialog" style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}>
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>Part definition editor</p>
            <h2 style={{ color: "var(--text-title)" }}>{partDefinitionModalMode === "create" ? "Add part definition" : "Edit part definition"}</h2>
          </div>
          <button className="icon-button" onClick={closePartDefinitionModal} type="button" style={{ color: "var(--text-copy)", background: "transparent" }}>Close</button>
        </div>
        <form className="modal-form" onSubmit={handlePartDefinitionSubmit} style={{ color: "var(--text-copy)" }}>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Name</span>
            <input onChange={(event) => setPartDefinitionDraft((current) => ({ ...current, name: event.target.value }))} required style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={partDefinitionDraft.name} />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Part number</span>
            <input onChange={(event) => setPartDefinitionDraft((current) => ({ ...current, partNumber: event.target.value }))} required style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={partDefinitionDraft.partNumber} />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Revision</span>
            <input onChange={(event) => setPartDefinitionDraft((current) => ({ ...current, revision: event.target.value }))} required style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={partDefinitionDraft.revision} />
          </label>
          {partDefinitionModalMode === "edit" ? (
            <label className="field">
              <span style={{ color: "var(--text-title)" }}>Iteration</span>
              <select
                onChange={(event) =>
                  setPartDefinitionDraft((current) => ({
                    ...current,
                    iteration: Number(event.target.value),
                  }))
                }
                style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
                value={partDefinitionDraft.iteration ?? 1}
              >
                {partDefinitionIterationOptions.map((iteration) => (
                  <option key={iteration} value={iteration}>
                    {formatIterationVersion(iteration)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Type</span>
            <input onChange={(event) => setPartDefinitionDraft((current) => ({ ...current, type: event.target.value }))} required style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={partDefinitionDraft.type} />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Source</span>
            <input onChange={(event) => setPartDefinitionDraft((current) => ({ ...current, source: event.target.value }))} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={partDefinitionDraft.source} />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Part type</span>
            <div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--text-title)" }}>
                <input
                  checked={partDefinitionDraft.isHardware}
                  onChange={(event) =>
                    setPartDefinitionDraft((current) => ({
                      ...current,
                      isHardware: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                Hardware part
              </span>
            </div>
          </label>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Default material</span>
            <select onChange={(event) => setPartDefinitionDraft((current) => ({ ...current, materialId: event.target.value || null }))} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={partDefinitionDraft.materialId ?? ""}>
              <option value="">No material</option>
              {bootstrap.materials.map((material) => <option key={material.id} value={material.id}>{material.name}</option>)}
            </select>
          </label>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Description</span>
            <textarea onChange={(event) => setPartDefinitionDraft((current) => ({ ...current, description: event.target.value }))} rows={3} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={partDefinitionDraft.description} />
          </label>
          <PhotoUploadField
            currentUrl={partDefinitionDraft.photoUrl}
            label="Part photo"
            onChange={(value) =>
              setPartDefinitionDraft((current) => ({ ...current, photoUrl: value }))
            }
            onUpload={async (file) => {
              if (!partDefinitionPhotoProjectId) {
                throw new Error("No project is available for photo upload.");
              }

              return requestPhotoUpload(partDefinitionPhotoProjectId, file);
            }}
          />
          <div className="modal-actions modal-wide">
            {partDefinitionModalMode === "edit" && activePartDefinitionId ? (
              <button
                className={partDefinitionDraft.isArchived ? "secondary-action" : "danger-action"}
                disabled={isDeletingPartDefinition || isSavingPartDefinition}
                onClick={() => handleTogglePartDefinitionArchived(activePartDefinitionId)}
                type="button"
              >
                {partDefinitionDraft.isArchived
                  ? "Restore part definition"
                  : "Archive part definition"}
              </button>
            ) : null}
            {partDefinitionModalMode === "edit" && activePartDefinitionId ? (
              <button
                className="danger-action"
                disabled={isDeletingPartDefinition || isSavingPartDefinition}
                onClick={() => handleDeletePartDefinition(activePartDefinitionId)}
                type="button"
              >
                {isDeletingPartDefinition ? "Deleting..." : "Delete part definition"}
              </button>
            ) : null}
            <button className="secondary-action" onClick={closePartDefinitionModal} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} type="button">Cancel</button>
            <button className="primary-action" disabled={isSavingPartDefinition || isDeletingPartDefinition} type="submit">{isSavingPartDefinition ? "Saving..." : partDefinitionModalMode === "create" ? "Add part" : "Save changes"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

interface PartInstanceEditorModalProps {
  bootstrap: BootstrapPayload;
  closePartInstanceModal: () => void;
  handlePartInstanceSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSavingPartInstance: boolean;
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
  partDefinitionDraftsById: Record<string, BootstrapPayload["partDefinitions"][number]>;
  partInstanceDraft: PartInstancePayload;
  partInstanceModalMode: "create" | "edit";
  setPartInstanceDraft: Dispatch<SetStateAction<PartInstancePayload>>;
}

export function PartInstanceEditorModal({
  bootstrap,
  closePartInstanceModal,
  handlePartInstanceSubmit,
  isSavingPartInstance,
  requestPhotoUpload,
  partDefinitionDraftsById,
  partInstanceDraft,
  partInstanceModalMode,
  setPartInstanceDraft,
}: PartInstanceEditorModalProps) {
  const filteredMechanisms = bootstrap.mechanisms.filter(
    (mechanism) => mechanism.subsystemId === partInstanceDraft.subsystemId,
  );
  const partInstancePhotoProjectId =
    bootstrap.subsystems.find((subsystem) => subsystem.id === partInstanceDraft.subsystemId)
      ?.projectId ?? bootstrap.projects[0]?.id ?? null;

  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section aria-modal="true" className="modal-card" role="dialog" style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}>
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>Part instance editor</p>
            <h2 style={{ color: "var(--text-title)" }}>{partInstanceModalMode === "create" ? "Add part instance" : "Edit part instance"}</h2>
          </div>
          <button className="icon-button" onClick={closePartInstanceModal} type="button" style={{ color: "var(--text-copy)", background: "transparent" }}>Close</button>
        </div>
        <form className="modal-form" onSubmit={handlePartInstanceSubmit} style={{ color: "var(--text-copy)" }}>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Name</span>
            <input onChange={(event) => setPartInstanceDraft((current) => ({ ...current, name: event.target.value }))} placeholder={partDefinitionDraftsById[partInstanceDraft.partDefinitionId]?.name ?? "Installed part name"} required style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={partInstanceDraft.name} />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Part definition</span>
            <select onChange={(event) => setPartInstanceDraft((current) => ({ ...current, partDefinitionId: event.target.value }))} required style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={partInstanceDraft.partDefinitionId}>
              {bootstrap.partDefinitions.map((partDefinition) => <option key={partDefinition.id} value={partDefinition.id}>{partDefinition.partNumber} - {partDefinition.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Subsystem</span>
            <select
              onChange={(event) =>
                setPartInstanceDraft((current) => {
                  const subsystemId = event.target.value;
                  const nextMechanisms = bootstrap.mechanisms.filter(
                    (mechanism) => mechanism.subsystemId === subsystemId,
                  );

                  return {
                    ...current,
                    subsystemId,
                    mechanismId: nextMechanisms[0]?.id ?? null,
                  };
                })
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={partInstanceDraft.subsystemId}
            >
              {bootstrap.subsystems.map((subsystem) => <option key={subsystem.id} value={subsystem.id}>{subsystem.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Mechanism</span>
            <select
              onChange={(event) =>
                setPartInstanceDraft((current) => {
                  const mechanismId = event.target.value || null;
                  const selectedMechanism = mechanismId
                    ? bootstrap.mechanisms.find((mechanism) => mechanism.id === mechanismId) ?? null
                    : null;

                  return {
                    ...current,
                    subsystemId: selectedMechanism?.subsystemId ?? current.subsystemId,
                    mechanismId,
                  };
                })
              }
              required
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={partInstanceDraft.mechanismId ?? ""}
            >
              {filteredMechanisms.map((mechanism) => <option key={mechanism.id} value={mechanism.id}>{mechanism.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Quantity</span>
            <input min="1" onChange={(event) => setPartInstanceDraft((current) => ({ ...current, quantity: Number(event.target.value) }))} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} type="number" value={partInstanceDraft.quantity} />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Status</span>
            <select onChange={(event) => setPartInstanceDraft((current) => ({ ...current, status: event.target.value as PartInstancePayload["status"] }))} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={partInstanceDraft.status}>
              <option value="planned">Planned</option>
              <option value="needed">Needed</option>
              <option value="available">Available</option>
              <option value="installed">Installed</option>
              <option value="retired">Retired</option>
            </select>
          </label>
          <div className="checkbox-row modal-wide">
            <label className="checkbox-field">
              <input checked={partInstanceDraft.trackIndividually} onChange={(event) => setPartInstanceDraft((current) => ({ ...current, trackIndividually: event.target.checked }))} type="checkbox" />
              <span style={{ color: "var(--text-title)" }}>Track each physical part separately</span>
            </label>
          </div>
          <PhotoUploadField
            currentUrl={partInstanceDraft.photoUrl}
            label="Part photo"
            onChange={(value) =>
              setPartInstanceDraft((current) => ({ ...current, photoUrl: value }))
            }
            onUpload={async (file) => {
              if (!partInstancePhotoProjectId) {
                throw new Error("No project is available for photo upload.");
              }

              return requestPhotoUpload(partInstancePhotoProjectId, file);
            }}
          />
          <div className="modal-actions modal-wide">
            <button className="secondary-action" onClick={closePartInstanceModal} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} type="button">Cancel</button>
            <button className="primary-action" disabled={isSavingPartInstance} type="submit">{isSavingPartInstance ? "Saving..." : partInstanceModalMode === "create" ? "Add instance" : "Save changes"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
