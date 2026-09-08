import type { ComponentProps, ReactElement } from "react";
import { TaskEditorModal } from "../modals/TaskEditorModalContent";
import { TaskDetailsModal } from "../modals/TaskDetailsModalContent";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { buildEmptyTaskPayload } from "@/lib/appUtils/taskTargets/payloadDefaults";

it.each(["create", "edit"] as const)("freezes the %s form and refuses close/cancel during a pending save", (taskModalMode) => {
  const bootstrap = createBootstrap();
  const close = jest.fn(); const canceled = jest.fn(); const openDetails = jest.fn();
  const props = { bootstrap, taskDraft: buildEmptyTaskPayload(bootstrap), activeTask: bootstrap.tasks[0], taskModalMode, isSavingTask: true, isDeletingTask: false, closeTaskModal: close, onTaskEditCanceled: canceled, openTaskDetailsModal: openDetails } as unknown as ComponentProps<typeof TaskEditorModal>;
  const render = (saving: boolean) => {
    const form = TaskEditorModal({ ...props, isSavingTask: saving })!;
    const fieldset = form.props.children as ReactElement<{ disabled: boolean; inert: boolean; children: ReactElement<ComponentProps<typeof TaskDetailsModal>> }>;
    return { fieldset, details: fieldset.props.children.props };
  };
  const pending = render(true);
  expect(pending.fieldset.type).toBe("fieldset");
  expect(pending.fieldset.props.disabled).toBe(true);
  expect(pending.fieldset.props.inert).toBe(true);
  pending.details.closeTaskDetailsModal();
  const footer = pending.details.footerActions as ReactElement<{ children: ReactElement<{ children: string; onClick?: () => void }>[] }>;
  footer.props.children.find((button) => button && button.props.children === "Cancel")?.props.onClick?.();
  expect(close).not.toHaveBeenCalled(); expect(canceled).not.toHaveBeenCalled(); expect(openDetails).not.toHaveBeenCalled();
  const settled = render(false);
  expect(settled.fieldset.props.disabled).toBe(false);
  settled.details.closeTaskDetailsModal();
  expect(close).toHaveBeenCalledTimes(1);
});
