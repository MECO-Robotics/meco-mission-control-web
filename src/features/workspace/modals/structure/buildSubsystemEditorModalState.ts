import type { BootstrapPayload } from "@/types/bootstrap";
import type { SubsystemPayload } from "@/types/payloads";
import { buildIterationOptions, formatIterationVersion } from "@/lib/appUtils/common";

type BuildSubsystemEditorModalStateArgs = {
  activeSubsystemId: string | null;
  bootstrap: BootstrapPayload;
  subsystemDraft: SubsystemPayload;
  subsystemModalMode: "create" | "edit";
};

export type SubsystemEditorModalState = {
  currentSubsystem: BootstrapPayload["subsystems"][number] | null;
  parentSubsystemName: string | null;
  parentSubsystemOptions: BootstrapPayload["subsystems"];
  subsystemIterationOptions: number[];
  subsystemPhotoProjectId: string | null;
  title: string;
};

export function buildSubsystemEditorModalState({
  activeSubsystemId,
  bootstrap,
  subsystemDraft,
  subsystemModalMode,
}: BuildSubsystemEditorModalStateArgs): SubsystemEditorModalState {
  const currentSubsystem = activeSubsystemId
    ? bootstrap.subsystems.find((subsystem) => subsystem.id === activeSubsystemId) ?? null
    : null;
  const parentSubsystemOptions = bootstrap.subsystems.filter(
    (subsystem) => subsystem.id !== activeSubsystemId,
  );
  const parentSubsystemName = subsystemDraft.parentSubsystemId
    ? bootstrap.subsystems.find(
        (subsystem) => subsystem.id === subsystemDraft.parentSubsystemId,
      )?.name ?? "Unknown"
    : null;
  const subsystemIterationOptions = buildIterationOptions(
    bootstrap.subsystems
      .filter((subsystem) => subsystem.projectId === subsystemDraft.projectId)
      .map((subsystem) => subsystem.iteration),
    subsystemDraft.iteration,
  );
  const title =
    subsystemModalMode === "create"
      ? "Add subsystem"
      : bootstrap.subsystems.find((subsystem) => subsystem.id === activeSubsystemId)?.name ??
        "Edit subsystem";

  return {
    currentSubsystem,
    parentSubsystemName,
    parentSubsystemOptions,
    subsystemIterationOptions,
    subsystemPhotoProjectId: subsystemDraft.projectId || bootstrap.projects[0]?.id || null,
    title,
  };
}

export { formatIterationVersion };
