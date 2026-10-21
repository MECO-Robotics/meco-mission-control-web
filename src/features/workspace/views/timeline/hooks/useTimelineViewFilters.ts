import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";
import {
  type FilterSelection,
  pruneFilterSelection,
} from "@/features/workspace/shared/filters/workspaceFilterUtils";

import {
  buildTimelineWorkTypeFilterOptions,
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
  workTypeFilterOptions: DropdownOption[];
  filters: TimelineTaskFilters;
  setWorkTypeFilter: Dispatch<SetStateAction<FilterSelection>>;
  setPriorityFilter: Dispatch<SetStateAction<FilterSelection>>;
  setProjectFilter: Dispatch<SetStateAction<FilterSelection>>;
  setStatusFilter: Dispatch<SetStateAction<FilterSelection>>;
  setSubsystemFilter: Dispatch<SetStateAction<FilterSelection>>;
  setResponsibleGroupFilter: Dispatch<SetStateAction<FilterSelection>>;
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
    workTypeFilterOptions,
    isAllProjectsView,
    projectFilterOptions,
    subsystemFilterOptions,
    responsibleGroupFilterOptions,
  }: {
    workTypeFilterOptions: DropdownOption[];
    isAllProjectsView: boolean;
    projectFilterOptions: DropdownOption[];
    subsystemFilterOptions: DropdownOption[];
    responsibleGroupFilterOptions?: DropdownOption[];
  },
): TimelineTaskFilters {
  return {
    workTypeFilter: pruneStableFilterSelection(
      filters.workTypeFilter,
      workTypeFilterOptions,
    ),
    priorityFilter: pruneStableFilterSelection(
      filters.priorityFilter,
      TIMELINE_TASK_PRIORITY_OPTIONS,
    ),
    projectFilter: isAllProjectsView
      ? pruneStableFilterSelection(filters.projectFilter, projectFilterOptions)
      : [],
    statusFilter: pruneStableFilterSelection(
      filters.statusFilter,
      TIMELINE_TASK_STATUS_OPTIONS,
    ),
    subsystemFilter: pruneStableFilterSelection(filters.subsystemFilter, subsystemFilterOptions),
    responsibleGroupFilter: pruneStableFilterSelection(filters.responsibleGroupFilter ?? [], responsibleGroupFilterOptions ?? []),
  };
}

export function useTimelineViewFilters({
  activePersonFilter,
  bootstrap,
  isAllProjectsView,
}: UseTimelineViewFiltersArgs): TimelineViewFilterControls {
  const [projectFilter, setProjectFilter] = useState<FilterSelection>([]);
  const [workTypeFilter, setWorkTypeFilter] = useState<FilterSelection>([]);
  const [responsibleGroupFilter, setResponsibleGroupFilter] = useState<FilterSelection>([]);
  const [subsystemFilter, setSubsystemFilter] = useState<FilterSelection>([]);
  const [statusFilter, setStatusFilter] = useState<FilterSelection>([]);
  const [priorityFilter, setPriorityFilter] = useState<FilterSelection>([]);

  const workTypeFilterOptions = useMemo(
    () => buildTimelineWorkTypeFilterOptions(bootstrap),
    [bootstrap],
  );
  const subsystemFilterOptions = useMemo(
    () => buildTimelineSubsystemFilterOptions(bootstrap),
    [bootstrap],
  );
  const projectFilterOptions = useMemo(() => bootstrap.projects, [bootstrap.projects]);

  const filters = useMemo(
    () => ({
      workTypeFilter,
      priorityFilter,
      projectFilter,
      statusFilter,
      subsystemFilter,
      responsibleGroupFilter,
    }),
    [workTypeFilter, priorityFilter, projectFilter, statusFilter, subsystemFilter, responsibleGroupFilter],
  );

  useEffect(() => {
    const prunedFilters = pruneTimelineFilterSelections(filters, {
      workTypeFilterOptions,
      isAllProjectsView,
      projectFilterOptions,
      subsystemFilterOptions,
      responsibleGroupFilterOptions: bootstrap.responsibleGroups,
    });

    if (prunedFilters.responsibleGroupFilter !== filters.responsibleGroupFilter) {
      setResponsibleGroupFilter(prunedFilters.responsibleGroupFilter ?? []);
    }
    if (prunedFilters.projectFilter !== filters.projectFilter) {
      setProjectFilter(prunedFilters.projectFilter);
    }
    if (prunedFilters.workTypeFilter !== filters.workTypeFilter) {
      setWorkTypeFilter(prunedFilters.workTypeFilter);
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
  }, [
    bootstrap.responsibleGroups,
    workTypeFilterOptions,
    filters,
    isAllProjectsView,
    projectFilterOptions,
    subsystemFilterOptions,
  ]);

  const activeFilterCount = countActiveTimelineFilters({
    activePersonFilter,
    ...filters,
    isAllProjectsView,
  });

  return {
    activeFilterCount,
    workTypeFilterOptions,
    filters,
    setWorkTypeFilter,
    setPriorityFilter,
    setProjectFilter,
    setStatusFilter,
    setSubsystemFilter,
    setResponsibleGroupFilter,
    subsystemFilterOptions,
  };
}
