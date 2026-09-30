import * as React from "react";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import { SortDirectionToggle } from "@/features/workspace/shared/filters/SortDirectionToggle";
import { ResourceSortMenu } from "../ResourceSortMenu";

describe("ResourceSortMenu", () => {
  it("uses the shared inline direction toggle beside the sort field", () => {
    const onDirectionChange = jest.fn();
    const onFieldChange = jest.fn();
    const menu = ResourceSortMenu({
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

    expect(items).toHaveLength(1);
    expect(menu.props.menuTitle).toBeUndefined();
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
