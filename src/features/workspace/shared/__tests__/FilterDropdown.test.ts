import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import { FilterOptionMenu } from "@/features/workspace/shared/filters/workspaceFilterDropdownMenu";
import { pruneFilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";

const options = [
  { id: "approved", name: "Approved" },
  { id: "requested", name: "Requested" },
];

describe("FilterDropdown column appearance", () => {
  it("keeps the compact inactive label and table trigger classes", () => {
    const markup = renderToStaticMarkup(
      createElement(FilterDropdown, {
        allLabel: "All statuses",
        ariaLabel: "Status",
        appearance: "column",
        buttonContent: createElement("svg", { "aria-hidden": true }),
        icon: createElement("svg", { "aria-hidden": true }),
        onChange: jest.fn(),
        options,
        value: [],
      }),
    );

    expect(markup).toContain('class="table-column-filter"');
    expect(markup).toContain('class="table-column-filter-button"');
    expect(markup).toContain('aria-label="Status"');
    expect(markup).not.toContain('aria-label="Status: All statuses"');
  });

  it("retains searchable options and removes selections whose options disappear", () => {
    const menu = renderToStaticMarkup(
      createElement(FilterOptionMenu, {
        allLabel: "All statuses",
        menuId: "status-menu",
        menuRef: { current: null },
        menuOffsetX: 0,
        onChange: jest.fn(),
        options,
        value: ["approved"],
      }),
    );

    expect(menu).toContain('aria-label="Search All statuses options"');
    expect(menu).toContain(">Approved</span>");
    expect(menu).toContain(">Requested</span>");
    expect(pruneFilterSelection(["approved", "removed"], options)).toEqual(["approved"]);
  });
});
