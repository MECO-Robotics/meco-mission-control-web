import { useInteractiveTutorialLifecycleInteractions } from "../useInteractiveTutorialLifecycleInteractions";
import { isInteractiveTutorialStepComplete } from "../helpers/interactiveTutorialStepCompletion";
import type {
  InteractiveTutorialStep,
  InteractiveTutorialStepCompletionContext,
} from "../interactiveTutorialTypes";
import type { BootstrapPayload } from "@/types/bootstrap";

const mockEffectCleanups: Array<() => void> = [];
jest.mock("react", () => ({
  useEffect: (effect: () => unknown) => {
    const cleanup = effect();
    if (typeof cleanup === "function") mockEffectCleanups.push(cleanup as () => void);
  },
  useState: (value: unknown) => [value, jest.fn()],
  useRef: (value: unknown) => ({ current: value }),
}));

const listeners = new Map<string, (event: unknown) => void>();
const removals = new Set<string>();
const target = {
  contains: () => true,
  querySelector: () => ({ value: "part" }),
  getAttribute: (name: string) => name === "aria-label" ? "Timeline interval: Week" : null,
};
class TestElement {
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
}

const context = {
  tutorialSeasonId: "tutorial",
  selectedSeasonId: "tutorial",
  tutorialProjectId: "tutorial-project",
  selectedProjectId: "tutorial-project",
} as InteractiveTutorialStepCompletionContext;

beforeEach(() => {
  jest.useFakeTimers();
  listeners.clear();
  removals.clear();
  mockEffectCleanups.length = 0;
  Object.assign(globalThis, {
    Element: TestElement,
    document: {
      addEventListener: (name: string, listener: (event: unknown) => void) => listeners.set(name, listener),
      removeEventListener: (name: string) => { removals.add(name); listeners.delete(name); },
      querySelector: () => target,
    },
    window: {
      setTimeout,
      clearTimeout,
      addEventListener: (name: string, listener: (event: unknown) => void) => listeners.set(name, listener),
      removeEventListener: (name: string) => { removals.add(name); listeners.delete(name); },
    },
  });
});
afterEach(() => {
  jest.useRealTimers();
  Reflect.deleteProperty(globalThis, "window");
  Reflect.deleteProperty(globalThis, "document");
  Reflect.deleteProperty(globalThis, "Element");
});

function useInteractionsHarness(step: InteractiveTutorialStep, stepCompletionContext = context) {
  const cleanupStart = mockEffectCleanups.length;
  const onAdvance = jest.fn();
  const onClose = jest.fn();
  useInteractiveTutorialLifecycleInteractions({
    currentStep: step,
    stepCompletionContext,
    tutorialSeasonName: "Tutorial",
    tutorialProjectName: "Tutorial Project",
    onAdvance,
    onClose,
    targetRef: { current: target as unknown as HTMLElement },
    stepBaselineLabelRef: { current: null },
  });
  return {
    onAdvance,
    onClose,
    cleanup: () => mockEffectCleanups.slice(cleanupStart).forEach((cleanup) => cleanup()),
  };
}

function click(targetElement: TestElement) {
  const event = { target: targetElement, preventDefault: jest.fn(), stopPropagation: jest.fn() };
  listeners.get("click")!(event);
  return event;
}

test("tutorial card clicks are ignored and popup choices complete the actual scope", () => {
  const { onAdvance } = useInteractionsHarness({ id: "season", title: "Season", instruction: "Choose season", selector: ".sidebar-scope-trigger" });
  for (const element of [new TestElement(true), new TestElement()]) {
    const event = click(element);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(event.stopPropagation).not.toHaveBeenCalled();
  }
  click(new TestElement(false, true));
  jest.runAllTimers();
  expect(onAdvance).toHaveBeenCalledTimes(1);
  expect(isInteractiveTutorialStepComplete(
    { id: "season", title: "", instruction: "", selector: ".sidebar-scope-trigger" },
    { ...context, selectedSeasonId: "wrong" },
  )).toBe(false);
});

test("completed creation steps advance after a short delay", () => {
  const bootstrap = {
    tasks: [{ id: "new-task", projectId: "tutorial-project" }],
    workLogs: [], partDefinitions: [], partInstances: [], subsystems: [], mechanisms: [], members: [],
    materials: [], purchaseItems: [], milestones: [], manufacturingItems: [], artifacts: [],
  } as unknown as BootstrapPayload;
  const baselineCounts = {
    tasks: 0, workLogs: 0, partDefinitions: 0, partInstances: 0, subsystems: 0, mechanisms: 0,
    students: 0, materials: 0, purchaseItems: 0, milestones: 0, cncJobs: 0, printJobs: 0,
    fabricationJobs: 0, completedPrintJobs: 0, documents: 0,
  };
  const { onAdvance } = useInteractionsHarness(
    { id: "create-task", title: "Create task", instruction: "Create a task", selector: "[data-tutorial-target='create-task-button']" },
    { ...context, bootstrap, baselineCounts, tutorialSeasonId: null } as InteractiveTutorialStepCompletionContext,
  );
  jest.advanceTimersByTime(119);
  expect(onAdvance).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(onAdvance).toHaveBeenCalledTimes(1);
});

test("changing steps cancels a pending creation advance", () => {
  const bootstrap = {
    tasks: [{ id: "new-task", projectId: "tutorial-project" }],
    workLogs: [], partDefinitions: [], partInstances: [], subsystems: [], mechanisms: [], members: [],
    materials: [], purchaseItems: [], milestones: [], manufacturingItems: [], artifacts: [],
  } as unknown as BootstrapPayload;
  const baselineCounts = {
    tasks: 0, workLogs: 0, partDefinitions: 0, partInstances: 0, subsystems: 0, mechanisms: 0,
    students: 0, materials: 0, purchaseItems: 0, milestones: 0, cncJobs: 0, printJobs: 0,
    fabricationJobs: 0, completedPrintJobs: 0, documents: 0,
  };
  const creation = useInteractionsHarness(
    { id: "create-task", title: "Create task", instruction: "Create a task", selector: "[data-tutorial-target='create-task-button']" },
    { ...context, bootstrap, baselineCounts, tutorialSeasonId: null } as InteractiveTutorialStepCompletionContext,
  );
  creation.cleanup();
  jest.runAllTimers();
  expect(creation.onAdvance).not.toHaveBeenCalled();
});

test("input and change events complete their matching steps", () => {
  const search = useInteractionsHarness({ id: "part-search", title: "Search", instruction: "Search", selector: ".part-search" });
  listeners.get("input")!({ target });
  jest.runAllTimers();
  expect(search.onAdvance).toHaveBeenCalledTimes(1);
  search.cleanup();

  const interval = useInteractionsHarness({ id: "timeline-week-view", title: "Week", instruction: "Choose week", selector: ".interval" });
  listeners.get("change")!({ target });
  jest.runAllTimers();
  expect(interval.onAdvance).toHaveBeenCalledTimes(1);
});

test("Escape closes the tutorial and cleanup cancels pending work and removes every listener", () => {
  const { onAdvance, onClose, cleanup } = useInteractionsHarness({ id: "season", title: "Season", instruction: "Choose season", selector: ".sidebar-scope-trigger" });
  const event = { key: "Escape", preventDefault: jest.fn() };
  listeners.get("keydown")!(event);
  expect(event.preventDefault).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(1);

  click(new TestElement(false, true));
  cleanup();
  jest.runAllTimers();
  expect(onAdvance).not.toHaveBeenCalled();
  expect(listeners.size).toBe(0);
  expect(removals).toEqual(new Set(["click", "change", "input", "keydown"]));
});
