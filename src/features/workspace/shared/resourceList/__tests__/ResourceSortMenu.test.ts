import * as React from "react";
import { SortDirectionToggle } from "@/features/workspace/shared/filters/SortDirectionToggle";
import { ResourceSortMenu } from "../ResourceSortMenu";

describe("ResourceSortMenu", () => {
  it("uses the shared inline direction toggle beside the sort field", () => {
    const onDirectionChange = jest.fn();
    const menu = ResourceSortMenu({
      direction: "ascending",
      field: "project",
      label: "tasks",
      onDirectionChange,
      onFieldChange: jest.fn(),
      options: [{ label: "Project", value: "project" }],
    });
    const items = menu.props.items as Array<{
      label: string;
      labelControl?: React.ReactElement<{
        direction: "ascending" | "descending";
        label: string;
        onChange: (direction: "ascending" | "descending") => void;
      }>;
    }>;
    const sortBy = items[0];

    expect(items).toHaveLength(1);
    expect(sortBy?.label).toBe("Sort by");
    expect(sortBy?.labelControl?.type).toBe(SortDirectionToggle);
    expect(sortBy?.labelControl?.props).toMatchObject({ direction: "ascending", label: "tasks" });
    sortBy?.labelControl?.props.onChange("descending");
    expect(onDirectionChange).toHaveBeenCalledWith("descending");
  });
});
