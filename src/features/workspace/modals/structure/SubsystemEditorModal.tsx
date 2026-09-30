import type { Dispatch, FormEvent, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { SubsystemPayload } from "@/types/payloads";

import { EditorModalShell } from "../EditorModalShell";
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
  subsystemModalMode: "create" | "edit";
  setSubsystemDraft: Dispatch<SetStateAction<SubsystemPayload>>;
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
  subsystemModalMode,
  setSubsystemDraft,
}: SubsystemEditorModalProps) {
  const subsystemState = buildSubsystemEditorModalState({
    activeSubsystemId,
    bootstrap,
    subsystemDraft,
    subsystemModalMode,
  });

  return (
    <EditorModalShell
      eyebrowLabel="Subsystem editor"
      onClose={closeSubsystemModal}
      onSubmit={handleSubsystemSubmit}
      title={subsystemState.title}
    >
      <SubsystemEditorModalFields
        bootstrap={bootstrap}
        requestPhotoUpload={requestPhotoUpload}
        subsystemDraft={subsystemDraft}
        subsystemModalMode={subsystemModalMode}
        setSubsystemDraft={setSubsystemDraft}
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
    </EditorModalShell>
  );
}
