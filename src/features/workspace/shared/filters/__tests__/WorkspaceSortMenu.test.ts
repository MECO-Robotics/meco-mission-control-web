import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { ArrowDownUp } from "lucide-react";

import { FilterDropdown } from "../FilterDropdown";
import { SortDirectionToggle } from "../SortDirectionToggle";
import { WorkspaceSortMenu } from "../WorkspaceSortMenu";
import { CompactFilterMenu } from "../workspaceCompactFilterMenu";

describe("WorkspaceSortMenu", () => {
  it("includes visible active-count badges in the menu accessible name", () => {
    const markup = ReactDOMServer.renderToStaticMarkup(React.createElement(CompactFilterMenu, {
      activeCount: 1,
      ariaLabel: "Sort documents",
      buttonLabel: "Sort",
      iconOnly: true,
      items: [{ label: "Sort by", content: React.createElement("span", null, "Document") }],
    }));
    expect(markup).toContain('aria-label="Sort documents, 1 active"');
  });

  it("shares the sort icon, field picker, and direction toggle across views", () => {
    const onDirectionChange = jest.fn();
    const onFieldChange = jest.fn();
    const menu = WorkspaceSortMenu({
      direction: "ascending",
      field: "project",
      label: "tasks",
      onDirectionChange,
      onFieldChange,
      options: [{ label: "Project", value: "project" }],
    });
    const items = menu.props.items as Array<{
      label: string;
      labelControl?: React.ReactElement<{
        direction: "ascending" | "descending";
        label: string;
        onChange: (direction: "ascending" | "descending") => void;
      }>;
      content?: React.ReactNode;
    }>;
    const sortBy = items[0];

    expect(menu.props.iconOnly).toBe(true);
    expect(menu.props.ariaLabel).toBe("Sort tasks");
    expect((menu.props.icon as React.ReactElement).type).toBe(ArrowDownUp);
    expect(sortBy?.label).toBe("Sort by");
    expect(sortBy?.labelControl?.type).toBe(SortDirectionToggle);
    expect(sortBy?.labelControl?.props).toMatchObject({ direction: "ascending", label: "tasks" });

    const fieldPicker = sortBy?.content as React.ReactElement<{
      onChange: (selection: string[]) => void;
      options: Array<{ id: string; name: string }>;
      showAllOption: boolean;
      singleSelect: boolean;
      value: string[];
    }>;
    expect(fieldPicker.type).toBe(FilterDropdown);
    expect(fieldPicker.props).toMatchObject({
      options: [{ id: "project", name: "Project" }],
      showAllOption: false,
      singleSelect: true,
      value: ["project"],
    });
    fieldPicker.props.onChange(["project"]);
    expect(onFieldChange).toHaveBeenCalledWith("project");
    sortBy?.labelControl?.props.onChange("descending");
    expect(onDirectionChange).toHaveBeenCalledWith("descending");
  });
});
