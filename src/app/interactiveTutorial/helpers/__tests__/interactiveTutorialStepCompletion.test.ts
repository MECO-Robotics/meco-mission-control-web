import type { InteractiveTutorialStep } from "@/app/interactiveTutorial/interactiveTutorialTypes";
import { isInteractiveTutorialStepComplete } from "../interactiveTutorialStepCompletion";

describe("isInteractiveTutorialStepComplete", () => {
  const step = {
    id: "milestone-edit",
    selector: '[data-tutorial-target="edit-milestone-row"]',
  } as InteractiveTutorialStep;

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "document");
  });

  it("accepts the milestone details modal for the milestone edit tutorial step", () => {
    (globalThis as typeof globalThis & { document: unknown }).document = {
      querySelector: jest.fn((selector: string) =>
        selector === '[data-tutorial-target="edit-milestone-row"]' ||
        selector === '[data-tutorial-target="milestone-detail-modal"]'
          ? ({} as HTMLElement)
          : null,
      ),
    } as never;

    expect(
      isInteractiveTutorialStepComplete(step, {
        activeTaskId: null,
        activeTimelineTaskDetailId: null,
        activeMaterialId: null,
        activeSubsystemId: null,
        activeMechanismId: null,
        activeWorkstreamId: null,
        bootstrap: { milestones: [], tasks: [] } as never,
        stepBaselineLabel: "",
        taskModalMode: null,
        materialModalMode: null,
        subsystemModalMode: null,
        mechanismModalMode: null,
        workstreamModalMode: null,
      } as never),
    ).toBe(true);
  });

  it("still accepts the legacy milestone edit modal path", () => {
    (globalThis as typeof globalThis & { document: unknown }).document = {
      querySelector: jest.fn((selector: string) =>
        selector === '[data-tutorial-target="edit-milestone-row"]' ||
        selector === '[data-tutorial-target="milestone-edit-modal"]'
          ? ({} as HTMLElement)
          : null,
      ),
    } as never;

    expect(
      isInteractiveTutorialStepComplete(step, {
        activeTaskId: null,
        activeTimelineTaskDetailId: null,
        activeMaterialId: null,
        activeSubsystemId: null,
        activeMechanismId: null,
        activeWorkstreamId: null,
        bootstrap: { milestones: [], tasks: [] } as never,
        stepBaselineLabel: "",
        taskModalMode: null,
        materialModalMode: null,
        subsystemModalMode: null,
        mechanismModalMode: null,
        workstreamModalMode: null,
      } as never),
    ).toBe(true);
  });
});
