import { ArrowDown, ArrowUp } from "lucide-react";

import { SortDirectionToggle } from "../SortDirectionToggle";

describe("SortDirectionToggle", () => {
  it.each([
    ["asc", "desc", ArrowUp],
    ["ascending", "descending", ArrowUp],
    ["desc", "asc", ArrowDown],
    ["descending", "ascending", ArrowDown],
  ] as const)("shows %s and switches to %s", (direction, nextDirection, Icon) => {
    const onChange = jest.fn();
    const button = SortDirectionToggle({ direction, label: "tasks", onChange });

    expect(button.props["aria-label"]).toBe("Toggle tasks sort direction");
    expect(button.props["aria-pressed"]).toBe(direction === "asc" || direction === "ascending");
    expect(button.props.children.type).toBe(Icon);
    button.props.onClick();
    expect(onChange).toHaveBeenCalledWith(nextDirection);
  });
});
