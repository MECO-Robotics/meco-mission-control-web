import type { Dispatch, FormEvent, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { SubsystemPayload } from "@/types/payloads";

import { StructureModalShell } from "./StructureModalShell";
import { SubsystemEditorModalActions } from "./SubsystemEditorModalActions";
import { SubsystemEditorModalFields } from "./SubsystemEditorModalFields";
import { buildSubsystemEditorModalState } from "./buildSubsystemEditorModalState";

interface SubsystemEditorModalProps {
  activeSubsystemId: string | null;
  bootstrap: BootstrapPayload;
  closeSubsystemModal: () => void;
  handleToggleSubsystemArchived: (subsystemId: string) => void;
  handleSubsystemSubmit: (milestone: FormEvent<HTMLFormElement>) => void;
  isSavingSubsystem: boolean;
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
  subsystemDraft: SubsystemPayload;
  subsystemDraftRisks: string;
  subsystemModalMode: "create" | "edit";
  setSubsystemDraft: Dispatch<SetStateAction<SubsystemPayload>>;
  setSubsystemDraftRisks: (value: string) => void;
}

export function SubsystemEditorModal({
  activeSubsystemId,
  bootstrap,
  closeSubsystemModal,
  handleToggleSubsystemArchived,
  handleSubsystemSubmit,
  isSavingSubsystem,
  requestPhotoUpload,
  subsystemDraft,
  subsystemDraftRisks,
  subsystemModalMode,
  setSubsystemDraft,
  setSubsystemDraftRisks,
}: SubsystemEditorModalProps) {
  const subsystemState = buildSubsystemEditorModalState({
    activeSubsystemId,
    bootstrap,
    subsystemDraft,
    subsystemModalMode,
  });

  return (
    <StructureModalShell
      eyebrowLabel="Subsystem editor"
      onClose={closeSubsystemModal}
      onSubmit={handleSubsystemSubmit}
      title={subsystemState.title}
    >
      <SubsystemEditorModalFields
        bootstrap={bootstrap}
        requestPhotoUpload={requestPhotoUpload}
        subsystemDraft={subsystemDraft}
        subsystemDraftRisks={subsystemDraftRisks}
        subsystemModalMode={subsystemModalMode}
        setSubsystemDraft={setSubsystemDraft}
        setSubsystemDraftRisks={setSubsystemDraftRisks}
        subsystemState={subsystemState}
      />
      <SubsystemEditorModalActions
        activeSubsystemId={activeSubsystemId}
        closeSubsystemModal={closeSubsystemModal}
        handleToggleSubsystemArchived={handleToggleSubsystemArchived}
        isSavingSubsystem={isSavingSubsystem}
        subsystemDraft={subsystemDraft}
        subsystemModalMode={subsystemModalMode}
      />
    </StructureModalShell>
  );
}
