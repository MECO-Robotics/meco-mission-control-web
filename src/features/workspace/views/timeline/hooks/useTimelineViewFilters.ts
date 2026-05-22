import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";
import {
  type FilterSelection,
  pruneFilterSelection,
} from "@/features/workspace/shared/filters/workspaceFilterUtils";

import {
  buildTimelineDisciplineFilterOptions,
  buildTimelineSubsystemFilterOptions,
  countActiveTimelineFilters,
  TIMELINE_TASK_PRIORITY_OPTIONS,
  TIMELINE_TASK_STATUS_OPTIONS,
  type TimelineTaskFilters,
} from "../model/timelineViewFilters";

interface UseTimelineViewFiltersArgs {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
}

export interface TimelineViewFilterControls {
  activeFilterCount: number;
  disciplineFilterOptions: DropdownOption[];
  filters: TimelineTaskFilters;
  setDisciplineFilter: Dispatch<SetStateAction<FilterSelection>>;
  setPriorityFilter: Dispatch<SetStateAction<FilterSelection>>;
  setProjectFilter: Dispatch<SetStateAction<FilterSelection>>;
  setStatusFilter: Dispatch<SetStateAction<FilterSelection>>;
  setSubsystemFilter: Dispatch<SetStateAction<FilterSelection>>;
  subsystemFilterOptions: DropdownOption[];
}

function pruneStableFilterSelection(selection: FilterSelection, options: DropdownOption[]) {
  const pruned = pruneFilterSelection(selection, options);

  if (
    pruned.length === selection.length &&
    pruned.every((selectedValue, index) => selectedValue === selection[index])
  ) {
    return selection;
  }

  return pruned;
}

export function pruneTimelineFilterSelections(
  filters: TimelineTaskFilters,
  {
    disciplineFilterOptions,
    isAllProjectsView,
    projectFilterOptions,
    subsystemFilterOptions,
  }: {
    disciplineFilterOptions: DropdownOption[];
    isAllProjectsView: boolean;
    projectFilterOptions: DropdownOption[];
    subsystemFilterOptions: DropdownOption[];
  },
): TimelineTaskFilters {
  return {
    disciplineFilter: pruneStableFilterSelection(
      filters.disciplineFilter,
      disciplineFilterOptions,
    ),
    priorityFilter: pruneStableFilterSelection(
      filters.priorityFilter,
      TIMELINE_TASK_PRIORITY_OPTIONS,
    ),
    projectFilter: isAllProjectsView
      ? pruneStableFilterSelection(filters.projectFilter, projectFilterOptions)
      : filters.projectFilter.length > 0
        ? []
        : filters.projectFilter,
    statusFilter: pruneStableFilterSelection(
      filters.statusFilter,
      TIMELINE_TASK_STATUS_OPTIONS,
    ),
    subsystemFilter: pruneStableFilterSelection(
      filters.subsystemFilter,
      subsystemFilterOptions,
    ),
  };
}

export function useTimelineViewFilters({
  activePersonFilter,
  bootstrap,
  isAllProjectsView,
}: UseTimelineViewFiltersArgs): TimelineViewFilterControls {
  const [projectFilter, setProjectFilter] = useState<FilterSelection>([]);
  const [disciplineFilter, setDisciplineFilter] = useState<FilterSelection>([]);
  const [subsystemFilter, setSubsystemFilter] = useState<FilterSelection>([]);
  const [statusFilter, setStatusFilter] = useState<FilterSelection>([]);
  const [priorityFilter, setPriorityFilter] = useState<FilterSelection>([]);

  const disciplineFilterOptions = useMemo(
    () => buildTimelineDisciplineFilterOptions(bootstrap),
    [bootstrap],
  );
  const subsystemFilterOptions = useMemo(
    () => buildTimelineSubsystemFilterOptions(bootstrap),
    [bootstrap],
  );

  const filters = useMemo(
    () => ({
      disciplineFilter,
      priorityFilter,
      projectFilter,
      statusFilter,
      subsystemFilter,
    }),
    [disciplineFilter, priorityFilter, projectFilter, statusFilter, subsystemFilter],
  );

  useEffect(() => {
    const prunedFilters = pruneTimelineFilterSelections(filters, {
      disciplineFilterOptions,
      isAllProjectsView,
      projectFilterOptions: bootstrap.projects,
      subsystemFilterOptions,
    });

    if (prunedFilters.projectFilter !== filters.projectFilter) {
      setProjectFilter(prunedFilters.projectFilter);
    }
    if (prunedFilters.disciplineFilter !== filters.disciplineFilter) {
      setDisciplineFilter(prunedFilters.disciplineFilter);
    }
    if (prunedFilters.subsystemFilter !== filters.subsystemFilter) {
      setSubsystemFilter(prunedFilters.subsystemFilter);
    }
    if (prunedFilters.statusFilter !== filters.statusFilter) {
      setStatusFilter(prunedFilters.statusFilter);
    }
    if (prunedFilters.priorityFilter !== filters.priorityFilter) {
      setPriorityFilter(prunedFilters.priorityFilter);
    }
  }, [bootstrap.projects, disciplineFilterOptions, filters, isAllProjectsView, subsystemFilterOptions]);

  const activeFilterCount = countActiveTimelineFilters({
    activePersonFilter,
    ...filters,
    isAllProjectsView,
  });

  return {
    activeFilterCount,
    disciplineFilterOptions,
    filters,
    setDisciplineFilter,
    setPriorityFilter,
    setProjectFilter,
    setStatusFilter,
    setSubsystemFilter,
    subsystemFilterOptions,
  };
}
