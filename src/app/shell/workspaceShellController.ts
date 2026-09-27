import type { AppWorkspaceController } from "@/app/hooks/useAppWorkspaceController";

export function mergeWorkspaceShellController(controller: AppWorkspaceController) {
  return {
    ...controller.model,
    ...controller.model.taskEditor,
    ...controller.model.eventActions,
    ...controller.reportActions,
    ...controller.rosterActions,
    ...controller.model.artifactEditor,
    ...controller.model.workstreamEditor,
    ...controller.model.partDefinitionEditor,
    ...controller.model.partInstanceEditor,
    ...controller.model.subsystemEditor,
    ...controller.model.mechanismEditor,
    ...controller.model.purchaseEditor,
    ...controller.model.manufacturingEditor,
    ...controller.model.materialEditor,
  };
}

export type WorkspaceShellController = ReturnType<typeof mergeWorkspaceShellController>;
