import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";

import {
  buildTimelineDisciplineFilterOptions,
  buildTimelineSubsystemFilterOptions,
  countActiveTimelineFilters,
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

  useEffect(() => {
    if (!isAllProjectsView && projectFilter.length > 0) {
      setProjectFilter([]);
    }
  }, [isAllProjectsView, projectFilter]);

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
