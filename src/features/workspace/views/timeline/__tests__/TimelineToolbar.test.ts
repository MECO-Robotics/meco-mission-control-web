import React from "react";
import { TimelineToolbar } from "../TimelineToolbar";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { createBootstrap } from "@/features/workspace/__tests__/timeline/timelineTestFixtures";

const props: React.ComponentProps<typeof TimelineToolbar> = {
  bootstrap: createBootstrap(), isAllProjectsView: false, activeFilterCount: 0,
  activePersonFilter: [], workTypeFilter: [], workTypeFilterOptions: [], priorityFilter: [], projectFilter: [],
  responsibleGroupFilter: [], statusFilter: [], subsystemFilter: [], subsystemFilterOptions: [], searchFilter: "",
  onAdjustZoom: jest.fn(), onChangePersonFilter: jest.fn(), onIntervalChange: jest.fn(), onSearchChange: jest.fn(),
  onShiftPeriod: jest.fn(), onToday: jest.fn(), onFit: jest.fn(), setWorkTypeFilter: jest.fn(), setPriorityFilter: jest.fn(),
  setProjectFilter: jest.fn(), setResponsibleGroupFilter: jest.fn(), setStatusFilter: jest.fn(), setSubsystemFilter: jest.fn(),
  timelinePeriodLabel: "April 2026", timelineZoom: 1, viewInterval: "month", showAgenda: true,
  onShowAgendaChange: jest.fn(), isPhone: false, onOpenAgenda: jest.fn(),
};

function agendaControl(isPhone: boolean) {
  const toolbar = TimelineToolbar({ ...props, isPhone }) as React.ReactElement<{ children: React.ReactElement[] }>;
  const menu = toolbar.props.children.find((child) => child.type === CompactFilterMenu)!;
  const items = (menu.props as React.ComponentProps<typeof CompactFilterMenu>).items;
  expect(items.map((item) => item.label)).toEqual(["Agenda", "Timeline zoom"]);
  return items[0].content as React.ReactElement<{ onClick: () => void; children: React.ReactElement[] }>;
}

it("opens phone Agenda from View without a competing timeline switch", () => {
  const control = agendaControl(true);
  expect(control.type).toBe("button");
  expect(control.props.children).toBe("Open agenda");
  control.props.onClick();
  expect(props.onOpenAgenda).toHaveBeenCalledTimes(1);
  expect(props.onShowAgendaChange).not.toHaveBeenCalled();
});

it("keeps the desktop Agenda checkbox", () => {
  const control = agendaControl(false);
  expect(control.type).toBe("label");
  const checkbox = control.props.children[0] as React.ReactElement<{ checked: boolean; onChange: (event: { target: { checked: boolean } }) => void }>;
  expect(checkbox.props.checked).toBe(true);
  checkbox.props.onChange({ target: { checked: false } });
  expect(props.onShowAgendaChange).toHaveBeenCalledWith(false);
});
