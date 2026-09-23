import { Children, useCallback, useLayoutEffect, useRef, type ComponentProps, type ReactElement, type ReactNode } from "react";
jest.mock("react", () => ({ ...jest.requireActual("react"), useCallback: jest.fn((callback) => callback), useLayoutEffect: jest.fn(), useRef: jest.fn() }));
import { TaskEditorModal } from "../modals/TaskEditorModalContent";
import { TaskDetailsModal } from "../modals/TaskDetailsModalContent";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { buildEmptyTaskPayload } from "@/lib/appUtils/taskTargets/payloadDefaults";

it.each(["create", "edit"] as const)("freezes the %s form and refuses close/cancel during a pending save", (taskModalMode) => {
  const busy = { current: false };
  jest.mocked(useRef).mockImplementation((initial) => typeof initial === "boolean" ? busy : { current: initial });
  jest.mocked(useCallback).mockImplementation((callback) => callback);
  jest.mocked(useLayoutEffect).mockImplementation((effect) => { effect(); });
  const bootstrap = createBootstrap();
  const close = jest.fn(); const canceled = jest.fn(); const openDetails = jest.fn(); const updateDraft = jest.fn(); const resolveBlocker = jest.fn();
  const props = { bootstrap, taskDraft: buildEmptyTaskPayload(bootstrap), activeTask: bootstrap.tasks[0], taskModalMode, isSavingTask: true, isDeletingTask: false, closeTaskModal: close, onTaskEditCanceled: canceled, openTaskDetailsModal: openDetails, setTaskDraft: updateDraft, handleResolveTaskBlocker: resolveBlocker } as unknown as ComponentProps<typeof TaskEditorModal>;
  const render = (saving: boolean) => {
    const form = TaskEditorModal({ ...props, isSavingTask: saving })!;
    const fieldset = form.props.children as ReactElement<{ disabled: boolean; inert?: boolean; children: ReactElement<ComponentProps<typeof TaskDetailsModal>> }>;
    return { fieldset, details: fieldset.props.children.props };
  };
  const idle = render(false);
  const stalePortalEdit = idle.details.setTaskDraft!;
  const staleResolve = idle.details.onResolveTaskBlocker;
  const pending = render(true);
  stalePortalEdit((draft) => ({ ...draft, title: "Must not edit pending save" }));
  void staleResolve("pending-blocker");
  expect(updateDraft).not.toHaveBeenCalled();
  expect(resolveBlocker).not.toHaveBeenCalled();
  expect(pending.fieldset.type).toBe("fieldset");
  expect(pending.fieldset.props.disabled).toBe(true);
  expect(pending.fieldset.props.inert).toBeUndefined();
  pending.details.closeTaskDetailsModal();
  const clickCancel = (node: ReactNode): void => {
    for (const child of Children.toArray(node)) {
      if (typeof child === "object" && child !== null && "props" in child) {
        const element = child as ReactElement<{ children?: ReactNode; onClick?: () => void }>;
        if (element.props.children === "Cancel") {
          element.props.onClick?.();
          return;
        }
        clickCancel(element.props.children);
      }
    }
  };
  clickCancel(pending.details.footerActions);
  expect(close).not.toHaveBeenCalled(); expect(canceled).not.toHaveBeenCalled(); expect(openDetails).not.toHaveBeenCalled();
  const settled = render(false);
  expect(settled.fieldset.props.disabled).toBe(false);
  stalePortalEdit((draft) => ({ ...draft, title: "Editable again" }));
  expect(updateDraft).toHaveBeenCalledTimes(1);
  settled.details.closeTaskDetailsModal();
  expect(close).toHaveBeenCalledTimes(1);
});
