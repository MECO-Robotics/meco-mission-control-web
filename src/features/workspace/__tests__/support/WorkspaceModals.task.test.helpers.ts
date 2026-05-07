import * as React from "react";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TaskEditorModal } from "@/features/workspace/modals/TaskEditorModalContent";
import { buildEmptyTaskPayload } from "@/lib/appUtils/taskTargets";
import type { TaskRecord } from "@/types/recordsExecution";
import { createBootstrap } from "./WorkspaceModals.test.shared";

export function renderTaskModal(
  taskModalMode: ComponentProps<typeof TaskEditorModal>["taskModalMode"],
  overrides?: Partial<ReturnType<typeof buildEmptyTaskPayload>>,
  advancedSectionOpen = false,
) {
  const bootstrap = createBootstrap();
  const requestPhotoUpload = jest.fn(async () => "https://cdn.example.test/uploaded.png");
  const taskDraft = {
    ...buildEmptyTaskPayload(bootstrap),
    ...overrides,
    actualHours: 2,
  };
  const activeTask: TaskRecord = {
    id: "task-1",
    ...taskDraft,
    dependencyIds: [],
    blockers: [],
    linkedManufacturingIds: [],
    linkedPurchaseIds: [],
  };

  return renderToStaticMarkup(
    React.createElement(TaskEditorModal, {
      activeTask: taskModalMode === "edit" ? activeTask : null,
      bootstrap,
      closeTaskModal: jest.fn(),
      disciplinesById: Object.fromEntries(
        bootstrap.disciplines.map((discipline) => [discipline.id, discipline]),
      ),
      milestonesById: {},
      handleDeleteTask: jest.fn(),
      handleResolveTaskBlocker: jest.fn(async () => undefined),
      handleTaskSubmit: jest.fn(),
      isDeletingTask: false,
      isSavingTask: false,
      mechanismsById: {},
      mentors: bootstrap.members.filter((member) => member.role === "mentor"),
      partDefinitionsById: {},
      partInstancesById: {},
      requestPhotoUpload,
      openTaskDetailsModal: jest.fn(),
      onTaskEditCanceled: jest.fn(),
      advancedSectionOpen,
      setAdvancedSectionOpen: jest.fn(),
      students: bootstrap.members.filter((member) => member.role !== "mentor"),
      taskDraft,
      taskModalMode,
      setTaskDraft: jest.fn(),
    }),
  );
}
