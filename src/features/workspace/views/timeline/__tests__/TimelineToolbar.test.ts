import React from "react";
import { TimelineToolbar } from "../TimelineToolbar";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { WorkspaceTopbarZoom } from "@/features/workspace/shared/topbar";
import { createBootstrap } from "@/features/workspace/__tests__/timeline/timelineTestFixtures";

const props: React.ComponentProps<typeof TimelineToolbar> = {
  bootstrap: createBootstrap(), isAllProjectsView: false, activeFilterCount: 0,
  groupBy: "team", onGroupByChange: jest.fn(),
  activePersonFilter: [], workTypeFilter: [], workTypeFilterOptions: [], priorityFilter: [], projectFilter: [],
  responsibleGroupFilter: [], statusFilter: [], subsystemFilter: [], subsystemFilterOptions: [], searchFilter: "",
  onAdjustZoom: jest.fn(), onChangePersonFilter: jest.fn(), onIntervalChange: jest.fn(), onSearchChange: jest.fn(),
  onShiftPeriod: jest.fn(), onToday: jest.fn(), setWorkTypeFilter: jest.fn(), setPriorityFilter: jest.fn(),
  setProjectFilter: jest.fn(), setResponsibleGroupFilter: jest.fn(), setStatusFilter: jest.fn(), setSubsystemFilter: jest.fn(),
  timelinePeriodLabel: "April 2026", timelineZoom: 1, viewInterval: "month",
};

it.each([
  [1, "100%", false, true],
  [2, "200%", true, true],
  [4, "400%", true, false],
])("exposes %s zoom directly in the shared topbar with its limits", (timelineZoom, value, canZoomOut, canZoomIn) => {
  const toolbar = TimelineToolbar({ ...props, timelineZoom: timelineZoom as number }) as React.ReactElement<{ children: React.ReactElement[] }>;
  const zoom = toolbar.props.children.find((child) => child.type === WorkspaceTopbarZoom) as React.ReactElement<React.ComponentProps<typeof WorkspaceTopbarZoom>>;
  expect(zoom.props).toMatchObject({ ariaLabel: "Timeline zoom", value, canZoomOut, canZoomIn });
  zoom.props.onZoomIn();
  expect(props.onAdjustZoom).toHaveBeenLastCalledWith(1);
  zoom.props.onZoomOut();
  expect(props.onAdjustZoom).toHaveBeenLastCalledWith(-1);
});

it("offers Team and Subsystem grouping inside the shared search Sort action", () => {
  const toolbar = TimelineToolbar(props) as React.ReactElement<{ children: React.ReactElement[] }>;
  const search = toolbar.props.children.find((child) => child.type === TopbarResponsiveSearch) as React.ReactElement<React.ComponentProps<typeof TopbarResponsiveSearch>>;
  expect(search.props.actionCount).toBe(2);
  const actions = search.props.actions as React.ReactElement<{ children: React.ReactElement[] }>;
  const menu = actions.props.children.find((child) => child.type === CompactFilterMenu) as React.ReactElement<React.ComponentProps<typeof CompactFilterMenu>>;
  expect(menu.props).toMatchObject({ ariaLabel: "Sort schedule", activeCount: 0, iconOnly: true });
  expect(menu.props.items.map((item) => item.label)).toEqual(["Group by"]);
  const picker = menu.props.items[0].content as React.ReactElement<React.ComponentProps<typeof FilterDropdown>>;
  expect(picker.type).toBe(FilterDropdown);
  expect(picker.props).toMatchObject({
    ariaLabel: "Group schedule by", singleSelect: true, showAllOption: false, value: ["team"],
    options: [{ id: "team", name: "Team" }, { id: "subsystem", name: "Subsystem" }],
  });
  picker.props.onChange(["subsystem"]);
  expect(props.onGroupByChange).toHaveBeenLastCalledWith("subsystem");
  picker.props.onChange(["team"]);
  expect(props.onGroupByChange).toHaveBeenLastCalledWith("team");
});
