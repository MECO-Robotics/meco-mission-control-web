import React, { useId, useLayoutEffect, useRef, useState } from "react";
import { ProductTimelineDependencies } from "../../views/timeline/ProductTimelineDependencies";
import type { ProductTimelineDependencyPath } from "../../views/timeline/model/productTimelineDependencies";

jest.mock("react", () => ({ ...jest.requireActual("react"), useId: jest.fn(), useLayoutEffect: jest.fn(), useRef: jest.fn(), useState: jest.fn() }));

// The Node suite drives delegated events; browser QA owns DOM layout.
class BarElement {
  readonly taskId: string;
  readonly isBar: boolean;
  constructor(taskId: string, isBar = true) { this.taskId = taskId; this.isBar = isBar; }
  closest(selector: string) {
    return selector === ".product-timeline-bar" ? (this.isBar ? this : null) : { dataset: { taskId: this.taskId } };
  }
  matches() { return this.isBar; }
}

const originals = new Map(["Element", "HTMLElement"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
const barA = new BarElement("a");
const duplicateA = new BarElement("a");
const barB = new BarElement("b");
const titleA = new BarElement("a", false);
let bars: BarElement[];
let activeElement: BarElement | null;
let underPointer: BarElement | null;
let states: unknown[];
let stateIndex: number;
let refIndex: number;
let refs: Array<{ current: unknown }>;

const paths: ProductTimelineDependencyPath[] = [
  ["hard-in", "c", "a", "hard", "waiting", "one"],
  ["soft-in", "d", "a", "soft", "advisory", "one"],
  ["out", "a", "e", "hard", "satisfied", "one"],
  ["duplicate", "c", "a", "hard", "waiting", "two"],
  ["unrelated", "b", "f", "hard", "waiting", "one"],
].map(([id, sourceTaskId, targetTaskId, type, state, groupKey]) => ({ id, key: id, sourceTaskId, targetTaskId, type, state, groupKey, d: "M 0 0 L 10 10", points: [] })) as ProductTimelineDependencyPath[];

function render(children = "rows") {
  stateIndex = 0;
  refIndex = 0;
  jest.mocked(useLayoutEffect).mockClear();
  return ProductTimelineDependencies({ dependencies: [], children });
}

function painted(view: ReturnType<typeof render>, layer: "background" | "foreground") {
  const svgs = view.props.children[1] as React.ReactElement<{ className: string; children: React.ReactNode[] }>[];
  const svg = svgs.find((element) => element.props.className.endsWith(`is-${layer}`))!;
  return (svg.props.children[1] as React.ReactElement<{ "data-dependency-id": string }>[]).map((path) => path.props["data-dependency-id"]);
}

beforeEach(() => {
  Object.defineProperty(globalThis, "Element", { configurable: true, value: BarElement });
  Object.defineProperty(globalThis, "HTMLElement", { configurable: true, value: BarElement });
  bars = [barA, duplicateA, barB];
  activeElement = null;
  underPointer = null;
  states = [paths, null, null];
  refs = [
    { current: { contains: (element: BarElement) => bars.includes(element), ownerDocument: { get activeElement() { return activeElement; }, elementFromPoint: () => underPointer } } },
    { current: null },
    { current: null },
  ];
  jest.mocked(useId).mockReturnValue("arrows");
  jest.mocked(useRef).mockImplementation(() => refs[refIndex++] as ReturnType<typeof useRef>);
  jest.mocked(useState).mockImplementation(() => {
    const index = stateIndex++;
    return [states[index], (next: unknown) => { states[index] = typeof next === "function" ? next(states[index]) : next; }];
  });
});

afterEach(() => {
  for (const [key, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

it("promotes incoming hard and soft links and outgoing links across task instances, once per path", () => {
  let view = render();
  expect(painted(view, "foreground")).toEqual([]);
  expect(painted(view, "background")).toHaveLength(5);
  view.props.onPointerOver({ target: duplicateA, clientX: 20, clientY: 30 });
  view = render();
  expect(painted(view, "foreground")).toEqual(["hard-in", "soft-in", "out", "duplicate"]);
  expect(painted(view, "background")).toEqual(["unrelated"]);
  expect(new Set([...painted(view, "foreground"), ...painted(view, "background")]).size).toBe(5);
  view.props.onPointerOut({ relatedTarget: titleA });
  expect(painted(render(), "foreground")).toEqual([]);
});

it("prioritizes pointer hover, restores focus on leave or cancel, and keeps hover when focus blurs", () => {
  let view = render();
  view.props.onFocusCapture({ target: barB });
  expect(painted(render(), "foreground")).toEqual(["unrelated"]);
  view.props.onPointerMove({ target: barA, clientX: 20, clientY: 30 });
  view = render();
  expect(painted(view, "foreground")).toHaveLength(4);
  view.props.onBlurCapture({ relatedTarget: null });
  expect(painted(render(), "foreground")).toHaveLength(4);
  view.props.onFocusCapture({ target: barB });
  view.props.onPointerLeave();
  expect(painted(render(), "foreground")).toEqual(["unrelated"]);
  view.props.onPointerOver({ target: barA, clientX: 20, clientY: 30 });
  view.props.onPointerCancel();
  expect(painted(render(), "foreground")).toEqual(["unrelated"]);
  view.props.onBlurCapture({ relatedTarget: titleA });
  expect(painted(render(), "foreground")).toEqual([]);
});

it("reconciles a removed or moved bar after collapse and regroup without leaving stale emphasis", () => {
  const view = render();
  view.props.onPointerOver({ target: barA, clientX: 20, clientY: 30 });
  view.props.onFocusCapture({ target: barB });
  activeElement = barB;
  underPointer = barA;
  render("updated rows");
  jest.mocked(useLayoutEffect).mock.calls[0][0]();
  expect(painted(render(), "foreground")).toHaveLength(4);
  underPointer = barB;
  render("regrouped rows");
  jest.mocked(useLayoutEffect).mock.calls[0][0]();
  expect(painted(render(), "foreground")).toEqual(["unrelated"]);
  bars = [duplicateA];
  activeElement = null;
  render("collapsed rows");
  jest.mocked(useLayoutEffect).mock.calls[0][0]();
  expect(painted(render(), "foreground")).toEqual([]);
});
