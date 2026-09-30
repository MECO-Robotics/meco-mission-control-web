/// <reference types="jest" />

import * as React from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { CompactFilterMenuItem } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { ManufacturingQueueFilters } from "@/features/workspace/views/manufacturing/ManufacturingQueueFilters";

const bootstrap = {
  members: [{ id: "member-1", name: "Student" }],
  subsystems: [{ id: "subsystem-1", name: "Drive" }],
} as BootstrapPayload;

describe("ManufacturingQueueFilters", () => {
  it("keeps each dropdown label and preserves process-only behavior", () => {
    const changes: FilterSelection[] = [];
    const props = {
      activeCount: 0,
      bootstrap,
      onMaterialChange: (value: FilterSelection) => changes.push(value),
      onProcessChange: (value: FilterSelection) => changes.push(value),
      onRequesterChange: (value: FilterSelection) => changes.push(value),
      onStatusChange: (value: FilterSelection) => changes.push(value),
      onSubsystemChange: (value: FilterSelection) => changes.push(value),
      processSelection: ["cnc"],
      requester: [],
      material: [],
      status: [],
      subsystem: [],
      title: "Manufacturing",
      uniqueMaterials: [{ id: "Aluminum", name: "Aluminum" }],
    };
    const menu = ManufacturingQueueFilters(props);
    const menuProps = menu.props as { items: CompactFilterMenuItem[] };
    const labels = menuProps.items.map((item) => item.label);

    expect(labels).toEqual(["Process", "Subsystem", "Requester", "Material", "Status"]);

    const dropdownProps = menuProps.items.map((item) => {
      expect(React.isValidElement(item.content)).toBe(true);
      return (item.content as React.ReactElement).props as {
        allLabel: string;
        ariaLabel: string;
        onChange: (value: FilterSelection) => void;
        selectedAllLabel: string;
        singleSelect?: boolean;
        value: FilterSelection;
      };
    });

    expect(dropdownProps.map(({ allLabel, ariaLabel, selectedAllLabel }) => [allLabel, ariaLabel, selectedAllLabel])).toEqual([
      ["All processes", "Filter Manufacturing by process", "All"],
      ["All subsystems", "Filter Manufacturing by subsystem", "All"],
      ["All requesters", "Filter Manufacturing by requester", "All"],
      ["All materials", "Filter Manufacturing by material", "All"],
      ["All statuses", "Filter Manufacturing by status", "All"],
    ]);
    expect(dropdownProps[0].singleSelect).toBe(true);
    expect(dropdownProps.slice(1).every(({ singleSelect }) => singleSelect === undefined)).toBe(true);
    expect(dropdownProps[0].value).toEqual(["cnc"]);
    dropdownProps[0].onChange(["prints"]);
    expect(changes).toEqual([["prints"]]);

    const withoutProcess = ManufacturingQueueFilters({ ...props, onProcessChange: undefined });
    expect((withoutProcess.props as { items: CompactFilterMenuItem[] }).items[0].hidden).toBe(true);
  });
});
