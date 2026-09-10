import { useInteractiveTutorialLifecycleInteractions } from "../useInteractiveTutorialLifecycleInteractions";
import { isInteractiveTutorialStepComplete } from "../helpers/interactiveTutorialStepCompletion";
import type { InteractiveTutorialStepCompletionContext } from "../interactiveTutorialTypes";

jest.mock("react", () => ({
  useEffect: (effect: () => unknown) => effect(),
  useState: (value: unknown) => [value, jest.fn()],
  useRef: (value: unknown) => ({ current: value }),
}));
jest.mock("../useInteractiveTutorialLifecycleCreationAdvance", () => ({ useInteractiveTutorialLifecycleCreationAdvance: jest.fn() }));

const listeners = new Map<string, (event: unknown) => void>();
class TestElement {
  private readonly card: boolean;
  private readonly option: boolean;
  constructor(card = false, option = false) { this.card = card; this.option = option; }
  closest(selector: string) {
    if (selector === ".interactive-tutorial-card") return this.card ? this : null;
    return this.option ? this : null;
  }
}
const context = { tutorialSeasonId: "tutorial", selectedSeasonId: "tutorial" } as InteractiveTutorialStepCompletionContext;
beforeEach(() => {
  jest.useFakeTimers();
  listeners.clear();
  Object.assign(globalThis, {
    Element: TestElement,
    document: { addEventListener: (name: string, listener: (event: unknown) => void) => listeners.set(name, listener), querySelector: () => ({}) },
    window: { setTimeout, clearTimeout, addEventListener: jest.fn() },
  });
});
afterEach(() => {
  jest.useRealTimers();
  Reflect.deleteProperty(globalThis, "window"); Reflect.deleteProperty(globalThis, "document"); Reflect.deleteProperty(globalThis, "Element");
});
function InteractionHarness() {
  const onAdvance = jest.fn();
  useInteractiveTutorialLifecycleInteractions({
    currentStep: { id: "season", title: "Season", instruction: "Choose season", selector: ".sidebar-scope-trigger" },
    stepCompletionContext: context, tutorialSeasonName: "Tutorial", tutorialProjectName: null,
    onAdvance, onClose: jest.fn(), targetRef: { current: null }, stepBaselineLabelRef: { current: null },
  });
  return onAdvance;
}
function click(target: TestElement) {
  const event = { target, preventDefault: jest.fn(), stopPropagation: jest.fn() };
  listeners.get("click")!(event);
  return event;
}
test("End tutorial card clicks and popup controls are never swallowed", () => {
  const advance = InteractionHarness();
  for (const target of [new TestElement(true), new TestElement()]) {
    const event = click(target);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(event.stopPropagation).not.toHaveBeenCalled();
  }
  jest.runAllTimers();
  expect(advance).not.toHaveBeenCalled();
});
test("choosing a scope popup option completes using the actual selected scope", () => {
  const advance = InteractionHarness();
  click(new TestElement(false, true));
  jest.runAllTimers();
  expect(advance).toHaveBeenCalledTimes(1);
  expect(isInteractiveTutorialStepComplete({ id: "season", title: "", instruction: "", selector: ".sidebar-scope-trigger" }, { ...context, selectedSeasonId: "wrong" })).toBe(false);
});
test("week interval completion accepts current button-based interval control", () => {
  Object.assign(globalThis, { document: { querySelector: () => ({ getAttribute: () => "Timeline interval: Week" }) } });
  expect(isInteractiveTutorialStepComplete({ id: "timeline-week-view", title: "", instruction: "", selector: "interval" }, context)).toBe(true);
});
