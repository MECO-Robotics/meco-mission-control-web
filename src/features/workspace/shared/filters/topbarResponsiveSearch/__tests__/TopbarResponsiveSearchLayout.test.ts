import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TopbarResponsiveSearchLayout } from "../TopbarResponsiveSearchLayout";

type Element = ReactElement<Record<string, unknown>>;
function elements(node: ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [node, ...elements(node.props.children as ReactNode)];
}
function props() {
  return {
    ariaLabel: "Search records", compactLabel: "Search", compactRef: { current: null },
    hasCompactLabelVariant: true, isActive: false, isCompactOpen: false, isDynamicMode: true,
    isIconMode: true, onChange: jest.fn(), placeholder: "Find tasks", resolvedPlaceholder: "Find tasks",
    rootClassName: "topbar-responsive-search", searchInputRef: { current: null }, searchRef: { current: null },
    setIsCompactOpen: jest.fn(), value: "", actions: createElement("button", { type: "button" }, "Sort"),
  };
}

it("opens a visible, focused search dialog from the dynamic icon button and preserves actions", () => {
  const options = props();
  const closed = TopbarResponsiveSearchLayout(options);
  const toggle = elements(closed).find(node => node.props["aria-haspopup"] === "dialog")!;
  expect(toggle.type).toBe("button");
  (toggle.props.onClick as () => void)();
  const change = options.setIsCompactOpen.mock.calls[0][0];
  expect(change(false)).toBe(true);
  expect(change(true)).toBe(false);
  expect(renderToStaticMarkup(closed)).toContain("Sort");
  expect(elements(closed).some(node => node.type === "input")).toBe(false);

  const open = TopbarResponsiveSearchLayout({ ...options, isCompactOpen: true, value: "drive" });
  const popup = elements(open).find(node => node.props.role === "dialog")!;
  expect(popup.props["aria-label"]).toBe("Search records");
  const input = elements(popup).find(node => node.type === "input")!;
  expect(input.props).toMatchObject({ autoFocus: true, ref: options.searchInputRef, type: "search", value: "drive" });
  (input.props.onChange as (event: { target: { value: string } }) => void)({ target: { value: "arm" } });
  expect(options.onChange).toHaveBeenCalledWith("arm");
  expect(renderToStaticMarkup(open)).toContain('aria-expanded="true"');
});

it("shares the popup with multi-state mode and leaves ordinary desktop search inline", () => {
  const options = props();
  const compact = TopbarResponsiveSearchLayout({ ...options, isDynamicMode: false, isCompactOpen: true });
  expect(renderToStaticMarkup(compact)).toContain('role="dialog"');
  const desktop = renderToStaticMarkup(TopbarResponsiveSearchLayout({ ...options, isIconMode: false }));
  expect(desktop).toContain('placeholder="Find tasks"');
  expect(desktop).not.toContain('role="dialog"');
  expect(desktop).not.toContain('aria-haspopup="dialog"');
  expect(desktop).toContain("Sort");
});
