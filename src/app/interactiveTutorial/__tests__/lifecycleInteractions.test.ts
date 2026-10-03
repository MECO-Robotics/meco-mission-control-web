import { useEffect, useRef, useState } from "react";
import { useInteractiveTutorialLifecycleInteractions } from "../useInteractiveTutorialLifecycleInteractions";
import { isInteractiveTutorialStepComplete } from "../helpers/interactiveTutorialStepCompletion";
import type { InteractiveTutorialStepId, InteractiveTutorialStepCompletionContext } from "../interactiveTutorialTypes";
import type { BootstrapPayload } from "@/types/bootstrap";

jest.mock("react", () => ({ useEffect: jest.fn(), useState: jest.fn(), useRef: jest.fn() }));

const listeners = new Map<string, (event: unknown) => void>();
const setError = jest.fn();
const effectCleanups: Array<() => void> = [];
function cleanup() {
  effectCleanups.splice(0).forEach((dispose) => dispose());
}
class TestElement {
  value = "";
  private readonly card: boolean;
  private readonly option: boolean;
  constructor(card = false, option = false) {
    this.card = card;
    this.option = option;
  }
  closest(selector: string) {
    if (selector === ".interactive-tutorial-card") return this.card ? this : null;
    return this.option ? this : null;
  }
  contains(node: unknown) { return node === this; }
  querySelector() { return this; }
  getAttribute() { return "Timeline interval: Week"; }
}
const context = { tutorialSeasonId: "tutorial", selectedSeasonId: "tutorial", tutorialProjectId: "robot" } as InteractiveTutorialStepCompletionContext;
const completedTaskContext = {
  ...context,
  tutorialProjectId: "tutorial-project",
  tutorialSeasonId: null,
  baselineCounts: {
    tasks: 0, workLogs: 0, partDefinitions: 0, partInstances: 0, subsystems: 0, mechanisms: 0,
    students: 0, materials: 0, purchaseItems: 0, milestones: 0, cncJobs: 0, printJobs: 0,
    fabricationJobs: 0, completedPrintJobs: 0, documents: 0,
  },
  bootstrap: {
    tasks: [{ id: "task-1", projectId: "tutorial-project" }],
    workLogs: [], partDefinitions: [], partInstances: [], subsystems: [], mechanisms: [], members: [],
    materials: [], purchaseItems: [], milestones: [], manufacturingItems: [], artifacts: [],
  } as unknown as BootstrapPayload,
} as InteractiveTutorialStepCompletionContext;
beforeEach(() => {
  jest.resetAllMocks();
  jest.useFakeTimers();
  listeners.clear();
  effectCleanups.length = 0;
  jest.mocked(useEffect).mockImplementation((effect) => {
    const dispose = effect();
    if (typeof dispose === "function") effectCleanups.push(dispose);
  });
  jest.mocked(useState).mockReturnValue([null, setError]);
  const addEventListener = (name: string, listener: (event: unknown) => void) => listeners.set(name, listener);
  const removeEventListener = (name: string, listener: (event: unknown) => void) => {
    if (listeners.get(name) === listener) listeners.delete(name);
  };
  Object.assign(globalThis, {
    Element: TestElement,
    document: { addEventListener, removeEventListener, querySelector: () => new TestElement() },
    window: { setTimeout, clearTimeout, addEventListener, removeEventListener },
  });
});
afterEach(() => {
  cleanup();
  jest.useRealTimers();
  Reflect.deleteProperty(globalThis, "window");
  Reflect.deleteProperty(globalThis, "document");
  Reflect.deleteProperty(globalThis, "Element");
});
function InteractionHarness(
  id: InteractiveTutorialStepId = "season",
  stepCompletionContext: InteractiveTutorialStepCompletionContext = context,
) {
  const target = new TestElement();
  const interactionRef = { current: {} as { stepCompletionContext: InteractiveTutorialStepCompletionContext; onAdvance: () => void; onClose: () => void } };
  const options = {
    currentStep: { id, title: "Step", instruction: "Continue", selector: ".target" },
    stepCompletionContext, tutorialSeasonName: "Tutorial", tutorialProjectName: "Robot",
    onAdvance: jest.fn(), onClose: jest.fn(), targetRef: { current: target as unknown as HTMLElement }, stepBaselineLabelRef: { current: null },
  };
  interactionRef.current = { stepCompletionContext, onAdvance: options.onAdvance, onClose: options.onClose };
  jest.mocked(useRef).mockReturnValue(interactionRef);
  const Render = () => useInteractiveTutorialLifecycleInteractions(options);
  Render();
  return {
    ...options, target,
    updateCallbacks(onAdvance: () => void, onClose: () => void) {
      Object.assign(options, { onAdvance, onClose });
      interactionRef.current = { ...interactionRef.current, onAdvance, onClose };
    },
    updateContext(next: InteractiveTutorialStepCompletionContext) {
      options.stepCompletionContext = next;
      interactionRef.current = { ...interactionRef.current, stepCompletionContext: next };
    },
  };
}
function emit(type: string, target: TestElement) {
  const event = { type, target, preventDefault: jest.fn(), stopPropagation: jest.fn() };
  listeners.get(type)!(event);
  return event;
}

test("End tutorial card clicks and unrelated popup controls are never swallowed", () => {
  const { onAdvance } = InteractionHarness();
  for (const target of [new TestElement(true), new TestElement()]) {
    const event = emit("click", target);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(event.stopPropagation).not.toHaveBeenCalled();
  }
  jest.runAllTimers();
  expect(onAdvance).not.toHaveBeenCalled();
});

test("scope popup clicks wait 100ms and use the latest selected context", () => {
  const owner = InteractionHarness();
  owner.updateContext({ ...context, selectedSeasonId: "wrong" });
  emit("click", new TestElement(false, true));
  jest.advanceTimersByTime(99);
  expect(owner.onAdvance).not.toHaveBeenCalled();
  owner.updateContext(context);
  jest.advanceTimersByTime(1);
  expect(owner.onAdvance).toHaveBeenCalledTimes(1);
  expect(setError).toHaveBeenLastCalledWith(null);
});

test("pending completion and Escape read the latest callbacks", () => {
  const owner = InteractionHarness();
  emit("click", new TestElement(false, true));
  const onAdvance = jest.fn();
  const onClose = jest.fn();
  owner.updateCallbacks(onAdvance, onClose);
  jest.advanceTimersByTime(100);
  listeners.get("keydown")!({ key: "Escape", preventDefault: jest.fn() });
  expect(onAdvance).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(owner.onAdvance).not.toHaveBeenCalled();
  expect(owner.onClose).not.toHaveBeenCalled();
});

test.each(["season", "timeline-week-view"] as const)("change checks %s at zero delay only within its target", (step) => {
  const { target, onAdvance } = InteractionHarness(step);
  emit("change", new TestElement());
  emit("input", target);
  jest.runAllTimers();
  expect(onAdvance).not.toHaveBeenCalled();
  emit("change", target);
  expect(onAdvance).not.toHaveBeenCalled();
  jest.advanceTimersByTime(0);
  expect(onAdvance).toHaveBeenCalledTimes(1);
});

test("search input uses the same error/completion decision, while change and outside input do nothing", () => {
  const { target, onAdvance } = InteractionHarness("part-search");
  Object.assign(document, { querySelector: () => target });
  emit("change", target);
  emit("input", new TestElement());
  jest.runAllTimers();
  expect(setError).not.toHaveBeenCalled();
  emit("input", target);
  jest.advanceTimersByTime(0);
  expect(setError).toHaveBeenLastCalledWith("Type in the parts search input to continue.");
  target.value = "bearing";
  emit("input", target);
  jest.advanceTimersByTime(0);
  expect(onAdvance).toHaveBeenCalledTimes(1);
  expect(setError).toHaveBeenLastCalledWith(null);
});

test("ordinary clicks retain the delayed error path and creation clicks leave advancement to creation tracking", () => {
  const first = InteractionHarness("timeline-edit-task");
  emit("click", new TestElement());
  jest.advanceTimersByTime(100);
  expect(first.onAdvance).not.toHaveBeenCalled();
  expect(setError).toHaveBeenLastCalledWith("Click Edit task from the timeline task details popup.");
  cleanup();
  const creation = InteractionHarness("create-task");
  emit("click", new TestElement());
  expect(setError).toHaveBeenLastCalledWith(null);
  expect(jest.getTimerCount()).toBe(0);
  expect(creation.onAdvance).not.toHaveBeenCalled();
});

test("completed creation steps advance after a delay and cleanup cancels pending advances", () => {
  const pending = InteractionHarness("create-task", completedTaskContext);
  jest.advanceTimersByTime(119);
  expect(pending.onAdvance).not.toHaveBeenCalled();
  cleanup();
  jest.runAllTimers();
  expect(pending.onAdvance).not.toHaveBeenCalled();

  const completed = InteractionHarness("create-task", completedTaskContext);
  jest.advanceTimersByTime(120);
  expect(completed.onAdvance).toHaveBeenCalledTimes(1);
});

test("cleanup cancels click and change timers and removes every listener", () => {
  const { target, onAdvance } = InteractionHarness();
  emit("click", new TestElement(false, true));
  emit("change", target);
  expect(jest.getTimerCount()).toBe(2);
  cleanup();
  expect(listeners.size).toBe(0);
  jest.runAllTimers();
  expect(onAdvance).not.toHaveBeenCalled();
  expect(setError).not.toHaveBeenCalled();
});

test("Escape closes the tutorial and prevents its default key action", () => {
  const { onClose } = InteractionHarness();
  const event = { key: "Escape", preventDefault: jest.fn() };
  listeners.get("keydown")!(event);
  expect(event.preventDefault).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("week interval completion accepts the current button-based control", () => {
  expect(isInteractiveTutorialStepComplete({ id: "timeline-week-view", title: "", instruction: "", selector: "interval" }, context)).toBe(true);
});

test("Schedule completion accepts the combined calendar and timeline destination", () => {
  Object.assign(document, { querySelector: (selector: string) => ({
    getAttribute: () => selector === ".schedule" ? "work-schedule" : "calendar",
  }) });
  expect(isInteractiveTutorialStepComplete({ id: "task-timeline", title: "", instruction: "", selector: ".schedule" }, context)).toBe(true);
});
