import { isValidElement, useRef, type ReactElement, type ReactNode } from "react";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { buildEmptyQaReportPayload, buildEmptyTestResultPayload, buildEmptyWorkLogPayload } from "@/lib/appUtils/payloadBuilders";
import { QaReportEditorModal } from "../QaReportEditorModal";
import { WorkLogEditorModal } from "../WorkLogEditorModal";
import { MilestoneReportEditorModal } from "../EventReportEditorModal";
import { WorkReportEditorActions } from "../WorkReportEditorActions";

jest.mock("react", () => ({ ...jest.requireActual("react"), useRef: jest.fn() }));

function findActions(node: ReactNode): ReactElement<{ onCancel: () => void }> | null {
  if (Array.isArray(node)) return node.map(findActions).find(Boolean) ?? null;
  if (!isValidElement<{ children?: ReactNode }>(node)) return null;
  if (node.type === WorkReportEditorActions) return node as ReactElement<{ onCancel: () => void }>;
  return findActions(node.props.children);
}

const cases = [
  { name: "work log", build: buildEmptyWorkLogPayload, render: (bootstrap: ReturnType<typeof createBootstrap>, draft: ReturnType<typeof buildEmptyWorkLogPayload>, close: () => void) => WorkLogEditorModal({ bootstrap, workLogDraft: draft, closeWorkLogModal: close, isSavingWorkLog: true, handleWorkLogSubmit: jest.fn(), setWorkLogDraft: jest.fn(), requestPhotoUpload: jest.fn() }) },
  { name: "QA report", build: buildEmptyQaReportPayload, render: (bootstrap: ReturnType<typeof createBootstrap>, draft: ReturnType<typeof buildEmptyQaReportPayload>, close: () => void) => QaReportEditorModal({ bootstrap, qaReportDraft: draft, closeQaReportModal: close, isSavingQaReport: true, handleQaReportSubmit: jest.fn(), setQaReportDraft: jest.fn(), requestPhotoUpload: jest.fn() }) },
  { name: "milestone report", build: buildEmptyTestResultPayload, render: (bootstrap: ReturnType<typeof createBootstrap>, draft: ReturnType<typeof buildEmptyTestResultPayload>, close: () => void) => MilestoneReportEditorModal({ bootstrap, milestoneReportDraft: draft, milestoneReportFindings: "", closeMilestoneReportModal: close, isSavingMilestoneReport: true, handleMilestoneReportSubmit: jest.fn(), setMilestoneReportDraft: jest.fn(), setMilestoneReportFindings: jest.fn(), requestPhotoUpload: jest.fn() }) },
] as const;

it.each(cases)("dismisses a pending $name through dialog and Cancel controls while retaining dirty confirmation", (item) => {
  const initialRef = { current: "" };
  jest.mocked(useRef).mockImplementation((initial) => {
    if (!initialRef.current) initialRef.current = String(initial);
    return initialRef;
  });
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const confirm = jest.fn(() => false);
  Object.defineProperty(globalThis, "window", { configurable: true, value: { confirm } });
  try {
    const bootstrap = createBootstrap();
    const draft = item.build(bootstrap);
    const close = jest.fn();
    // Each case's factory owns the payload type; both close paths share the same callback.
    const render = () => item.render(bootstrap, draft as never, close) as ReactElement<{ onClose: () => void }>;
    const clean = render();
    clean.props.onClose();
    expect(close).toHaveBeenCalledTimes(1);
    expect(confirm).not.toHaveBeenCalled();
    draft.notes = "A changed draft";
    const dirty = render();
    const actions = findActions(dirty);
    expect(actions).not.toBeNull();
    actions!.props.onCancel();
    expect(confirm).toHaveBeenCalledWith("Discard unsaved changes?");
    expect(close).toHaveBeenCalledTimes(1);
    confirm.mockReturnValue(true);
    dirty.props.onClose();
    expect(close).toHaveBeenCalledTimes(2);
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
