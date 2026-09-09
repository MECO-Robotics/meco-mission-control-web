import { useState, useRef, useEffect, type ReactElement } from "react";
import { AppSidebarAddMenu } from "../sidebar/AppSidebarAddMenu";
import { AppSidebarSettingsMenu } from "../sidebar/AppSidebarSettingsMenu";

jest.mock("react", () => ({ ...jest.requireActual("react"), useState: jest.fn(), useRef: jest.fn(), useEffect: jest.fn() }));

type MenuElement = ReactElement<{
  "data-open": string;
  onMouseEnter: () => void;
  children: [ReactElement<{ onClick: () => void }>, unknown];
}>;

it.each(["add", "settings"])("%s menu supports hover preview, pinned click, and outside dismissal", (kind) => {
  const previousDocument = globalThis.document;
  let open = false;
  let refIndex = 0;
  const hover = { current: false };
  const leave = new Map<string, () => void>();
  const outside = new Map<string, (event: { target: unknown }) => void>();
  const inside = {};
  const element = { current: {
    closest: () => ({ addEventListener: (name: string, callback: () => void) => leave.set(name, callback), removeEventListener: (name: string) => leave.delete(name) }),
    contains: (target: unknown) => target === inside,
  } };
  const effects: Array<() => void | (() => void)> = [];
  let cleanups: Array<() => void> = [];
  Object.defineProperty(globalThis, "document", { configurable: true, value: {
    addEventListener: (name: string, callback: (event: { target: unknown }) => void) => outside.set(name, callback),
    removeEventListener: (name: string) => outside.delete(name),
  } });
  jest.mocked(useState).mockImplementation(() => [open, (next: unknown) => { open = typeof next === "function" ? next(open) : Boolean(next); }]);
  jest.mocked(useRef).mockImplementation(() => (refIndex++ === 0 ? hover : element));
  jest.mocked(useEffect).mockImplementation((effect) => { effects.push(effect as () => void | (() => void)); });
  const render = () => {
    cleanups.forEach((cleanup) => cleanup());
    cleanups = [];
    refIndex = 0;
    effects.length = 0;
    const result = (kind === "add"
      ? AppSidebarAddMenu({ onCreateMilestone: jest.fn(), onCreatePart: jest.fn(), onCreateQaReport: jest.fn(), onCreateTask: jest.fn() })
      : AppSidebarSettingsMenu({ canSignIn: false, canSignOut: true, isCollapsed: false, isDarkMode: false, onRefreshWorkspace: jest.fn(), onSignIn: jest.fn(), onSignOut: jest.fn(), onToggleDarkMode: jest.fn() })) as MenuElement;
    for (const effect of effects) { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); }
    return result;
  };
  try {
    let tree = render();
    expect(tree.props["data-open"]).toBe("false");
    tree.props.onMouseEnter();
    tree = render();
    expect(tree.props["data-open"]).toBe("true");
    leave.get("mouseleave")!();
    expect(render().props["data-open"]).toBe("false");
    tree = render();
    tree.props.onMouseEnter();
    tree = render();
    tree.props.children[0].props.onClick();
    tree = render();
    expect(tree.props["data-open"]).toBe("true");
    expect(leave.size).toBe(0);
    outside.get("pointerdown")!({ target: inside });
    expect(open).toBe(true);
    outside.get("pointerdown")!({ target: {} });
    expect(render().props["data-open"]).toBe("false");
    tree = render();
    tree.props.children[0].props.onClick();
    expect(render().props["data-open"]).toBe("true");
    cleanups.forEach((cleanup) => cleanup());
    expect(outside.size).toBe(0);
  } finally {
    Object.defineProperty(globalThis, "document", { configurable: true, value: previousDocument });
  }
});
