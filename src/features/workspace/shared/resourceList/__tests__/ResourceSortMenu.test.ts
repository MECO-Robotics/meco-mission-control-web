import * as React from "react";
import { ResourceSortMenu } from "../ResourceSortMenu";

describe("ResourceSortMenu", () => {
  it("offers accessible arrow controls for ascending and descending order", () => {
    const onDirectionChange = jest.fn();
    const menu = ResourceSortMenu({
      direction: "ascending",
      field: "project",
      label: "tasks",
      onDirectionChange,
      onFieldChange: jest.fn(),
      options: [{ label: "Project", value: "project" }],
    });
    const items = menu.props.items as Array<{ label: string; content: React.ReactElement }>;
    const direction = items.find(({ label }) => label === "Direction")?.content;
    const children = (direction?.props as { children?: React.ReactNode } | undefined)?.children;
    const buttons = React.Children.toArray(children) as React.ReactElement<{
      "aria-label": string;
      "aria-pressed": boolean;
      onClick: () => void;
    }>[];

    expect(buttons.map(({ props }) => [props["aria-label"], props["aria-pressed"]])).toEqual([
      ["Sort tasks ascending", true],
      ["Sort tasks descending", false],
    ]);
    buttons[1].props.onClick();
    expect(onDirectionChange).toHaveBeenCalledWith("descending");
  });
});
