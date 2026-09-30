import { EditorModalShell } from "@/features/workspace/modals/EditorModalShell";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { PartInstancePayload } from "@/types/payloads";
import type { PartInstanceLocation } from "@/types/common";
import { PhotoUploadField } from "@/features/workspace/shared/media/PhotoUploadField";

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
  bootstrap, closePartInstanceModal, handlePartInstanceSubmit, isSavingPartInstance,
  requestPhotoUpload, partDefinitionDraftsById, partInstanceDraft, partInstanceModalMode, setPartInstanceDraft,
}: PartInstanceEditorModalProps) {
  const location = partInstanceDraft.location;
  const locationSubsystemId = location.kind === "installed" ? location.subsystemId : "";
  const locationMechanisms = bootstrap.mechanisms.filter((item) => item.subsystemId === locationSubsystemId);
  const projectId = bootstrap.subsystems.find((item) => item.id === partInstanceDraft.intendedSubsystemId)?.projectId ?? bootstrap.projects[0]?.id ?? null;
  const setLocation = (next: PartInstanceLocation) => setPartInstanceDraft((current) => ({ ...current, location: next }));
  const setIntendedSubsystem = (subsystemId: string) => setPartInstanceDraft((current) => ({
    ...current,
    intendedSubsystemId: subsystemId || null,
    intendedMechanismId: bootstrap.mechanisms.find((item) => item.subsystemId === subsystemId)?.id ?? null,
  }));

  return (
    <EditorModalShell
      dialogLabel="Part instance editor"
      eyebrowLabel="Physical inventory"
      title={partInstanceModalMode === "create" ? "Add physical part" : "Edit physical part"}
      onClose={closePartInstanceModal}
      onSubmit={handlePartInstanceSubmit}
    >
      <label className="field modal-wide">
        <span>Part definition</span>
        <select required value={partInstanceDraft.partDefinitionId} onChange={(event) => setPartInstanceDraft((current) => ({ ...current, partDefinitionId: event.target.value }))}>
          {Object.values(partDefinitionDraftsById).map((part) => <option key={part.id} value={part.id}>{part.partNumber} — {part.name}</option>)}
        </select>
      </label>
      <label className="field">
        <span>Intended subsystem</span>
        <select value={partInstanceDraft.intendedSubsystemId ?? ""} onChange={(event) => setIntendedSubsystem(event.target.value)}>
          <option value="">No intended subsystem</option>
          {bootstrap.subsystems.map((subsystem) => <option key={subsystem.id} value={subsystem.id}>{subsystem.name}</option>)}
        </select>
      </label>
      <label className="field">
        <span>Intended mechanism</span>
        <select value={partInstanceDraft.intendedMechanismId ?? ""} onChange={(event) => setPartInstanceDraft((current) => ({ ...current, intendedMechanismId: event.target.value || null }))}>
          <option value="">No intended mechanism</option>
          {bootstrap.mechanisms.filter((item) => !partInstanceDraft.intendedSubsystemId || item.subsystemId === partInstanceDraft.intendedSubsystemId).map((mechanism) => <option key={mechanism.id} value={mechanism.id}>{mechanism.name}</option>)}
        </select>
      </label>
      <label className="field">
        <span>Physical location</span>
        <select value={location.kind} onChange={(event) => {
          const kind = event.target.value as PartInstanceLocation["kind"];
          if (kind === "installed") setLocation({ kind, subsystemId: partInstanceDraft.intendedSubsystemId ?? bootstrap.subsystems[0]?.id ?? "", mechanismId: partInstanceDraft.intendedMechanismId });
          else if (kind === "stock" || kind === "repair") setLocation({ kind, location: "" });
          else if (kind === "retired") setLocation({ kind, location: null });
          else setLocation({ kind });
        }}>
          <option value="stock">Stock</option><option value="installed">Installed</option><option value="repair">Repair</option><option value="retired">Retired</option><option value="lost">Lost</option><option value="unlocated">Unlocated</option>
        </select>
      </label>
      {location.kind === "installed" ? (
        <>
          <label className="field"><span>Installed subsystem</span><select value={location.subsystemId} onChange={(event) => setLocation({ ...location, subsystemId: event.target.value, mechanismId: null })}>{bootstrap.subsystems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="field"><span>Installed mechanism</span><select value={location.mechanismId ?? ""} onChange={(event) => setLocation({ ...location, mechanismId: event.target.value || null })}><option value="">No mechanism</option>{locationMechanisms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        </>
      ) : null}
      {location.kind === "stock" || location.kind === "repair" || location.kind === "retired" ? (
        <label className="field"><span>{location.kind === "stock" ? "Stock location" : location.kind === "repair" ? "Repair location" : "Retirement location"}</span><input value={location.location ?? ""} onChange={(event) => setLocation({ ...location, location: event.target.value })} /></label>
      ) : null}
      <p className="section-copy modal-wide">Robot readiness is derived from QA, open Risks, and Task state; this form only records physical location.</p>
      <PhotoUploadField currentUrl={partInstanceDraft.photoUrl} label="Part photo" onChange={(value) => setPartInstanceDraft((current) => ({ ...current, photoUrl: value }))} onUpload={(file) => projectId ? requestPhotoUpload(projectId, file) : Promise.reject(new Error("Choose an intended subsystem or ensure a project exists before uploading."))} />
      <div className="modal-actions modal-wide"><button className="secondary-action" onClick={closePartInstanceModal} type="button">Cancel</button><button className="primary-action" disabled={isSavingPartInstance} type="submit">{isSavingPartInstance ? "Saving..." : partInstanceModalMode === "create" ? "Add instance" : "Save changes"}</button></div>
    </EditorModalShell>
  );
}
