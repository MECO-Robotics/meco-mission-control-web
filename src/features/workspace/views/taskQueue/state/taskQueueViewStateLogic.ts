import { useEffect, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { useFilterChangeMotionClass } from "@/features/workspace/shared/filters/workspaceFilterUtils";

import { readTaskSubsystemIds } from "../taskQueueKanbanCard";
import { TASK_QUEUE_LAZY_LOAD_BATCH_SIZE, getTaskQueueBoardState } from "../taskQueueKanbanBoardState";
import type { TaskQueueBoardState } from "../taskQueueKanbanBoardState";
import type { TaskSortField } from "../taskQueueViewState";
import { useTaskQueueProcessedTasks } from "./useTaskQueueProcessedTasks";

const SUBSYSTEM_ITERATION_DISCIPLINE_CODES = new Set<string>([
  "design",
  "manufacturing",
  "assembly",
  "electrical",
]);

export interface TaskQueueViewStateLogicArgs {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  disciplineFilter: FilterSelection;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  focusedBoardState: TaskQueueBoardState | null;
  isAllProjectsView: boolean;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  ownerFilter: FilterSelection;
  priorityFilter: FilterSelection;
  projectFilter: FilterSelection;
  searchFilter: string;
  setFocusedBoardState: Dispatch<SetStateAction<TaskQueueBoardState | null>>;
  setProjectFilter: Dispatch<SetStateAction<FilterSelection>>;
  setSubsystemIterationFilter: Dispatch<SetStateAction<FilterSelection>>;
  setVisibleTaskCount: Dispatch<SetStateAction<number>>;
  sortField: TaskSortField;
  sortOrder: "asc" | "desc";
  statusFilter: FilterSelection;
  subsystemFilter: FilterSelection;
  subsystemIterationFilter: FilterSelection;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
}

export function useTaskQueueViewStateLogic({
  activePersonFilter,
  bootstrap,
  disciplineFilter,
  disciplinesById,
  focusedBoardState,
  isAllProjectsView,
  membersById,
  ownerFilter,
  priorityFilter,
  projectFilter,
  searchFilter,
  setFocusedBoardState,
  setProjectFilter,
  setSubsystemIterationFilter,
  setVisibleTaskCount,
  sortField,
  sortOrder,
  statusFilter,
  subsystemFilter,
  subsystemIterationFilter,
  subsystemsById,
}: TaskQueueViewStateLogicArgs) {
  const selectedSubsystemId = subsystemFilter.length === 1 ? subsystemFilter[0] : null;
  const showSubsystemIterationFilter = useMemo(() => {
    if (!selectedSubsystemId) {
      return false;
    }

    const hasIterationSensitiveTask = bootstrap.tasks.some((task) => {
      const disciplineCode = task.disciplineId
        ? disciplinesById[task.disciplineId]?.code
        : null;

      return (
        Boolean(disciplineCode && SUBSYSTEM_ITERATION_DISCIPLINE_CODES.has(disciplineCode)) &&
        readTaskSubsystemIds(task).includes(selectedSubsystemId)
      );
    });

    if (hasIterationSensitiveTask) {
      return true;
    }

    return bootstrap.mechanisms.some(
      (mechanism) => mechanism.subsystemId === selectedSubsystemId,
    );
  }, [bootstrap.mechanisms, bootstrap.tasks, disciplinesById, selectedSubsystemId]);

  const {
    disciplineOptions,
    processedTasks,
    projectsById,
    subsystemFilterOptions,
    subsystemIterationOptions,
    workstreamsById,
  } = useTaskQueueProcessedTasks({
    activePersonFilter,
    bootstrap,
    disciplineFilter,
    disciplinesById,
    isAllProjectsView,
    membersById,
    ownerFilter,
    priorityFilter,
    projectFilter,
    searchFilter,
    sortField,
    sortOrder,
    statusFilter,
    subsystemFilter,
    subsystemIterationFilter,
    showSubsystemIterationFilter,
    subsystemsById,
  });

  useEffect(() => {
    if (!isAllProjectsView) {
      if (projectFilter.length > 0) {
        setProjectFilter([]);
      }
      return;
    }

    const projectIds = new Set(bootstrap.projects.map((project) => project.id));
    if (projectFilter.some((projectId) => !projectIds.has(projectId))) {
      setProjectFilter((current) => current.filter((projectId) => projectIds.has(projectId)));
    }
  }, [bootstrap.projects, isAllProjectsView, projectFilter, setProjectFilter]);

  useEffect(() => {
    if (!showSubsystemIterationFilter && subsystemIterationFilter.length > 0) {
      setSubsystemIterationFilter([]);
    }
  }, [setSubsystemIterationFilter, showSubsystemIterationFilter, subsystemIterationFilter]);

  useEffect(() => {
    if (focusedBoardState === null) {
      return;
    }

    const hasMatchingTasks = bootstrap.tasks.some(
      (task) => getTaskQueueBoardState(task, bootstrap) === focusedBoardState,
    );

    if (!hasMatchingTasks) {
      setFocusedBoardState(null);
    }
  }, [bootstrap, focusedBoardState, setFocusedBoardState]);

  useEffect(() => {
    if (focusedBoardState === null || typeof document === "undefined") {
      return;
    }

    const handleEscape = (milestone: KeyboardEvent) => {
      if (milestone.key === "Escape") {
        setFocusedBoardState(null);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [focusedBoardState, setFocusedBoardState]);

  useEffect(() => {
    setVisibleTaskCount(TASK_QUEUE_LAZY_LOAD_BATCH_SIZE);
  }, [processedTasks.length, setVisibleTaskCount]);

  const taskFilterMotionClass = useFilterChangeMotionClass([
    activePersonFilter,
    disciplineFilter,
    isAllProjectsView,
    ownerFilter,
    priorityFilter,
    projectFilter,
    searchFilter,
    sortField,
    sortOrder,
    statusFilter,
    subsystemFilter,
    subsystemIterationFilter,
  ]);

  const activeFilterCount = [
    isAllProjectsView ? projectFilter : [],
    disciplineFilter,
    subsystemFilter,
    showSubsystemIterationFilter ? subsystemIterationFilter : [],
    ownerFilter,
    statusFilter,
    priorityFilter,
  ].filter((selection) => selection.length > 0).length;

  return {
    activeFilterCount,
    disciplineOptions,
    processedTasks,
    projectsById,
    subsystemFilterOptions,
    subsystemIterationOptions,
    showProjectContextOnCards: !isAllProjectsView,
    showProjectOnCards: isAllProjectsView && projectFilter.length === 0,
    showSubsystemIterationFilter,
    taskFilterMotionClass,
    taskSortIsDefault: sortField === "dueDate" && sortOrder === "asc",
    workstreamsById,
  };
}
