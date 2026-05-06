import { useEffect, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import { formatIterationVersion } from "@/lib/appUtils/common";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { useFilterChangeMotionClass } from "@/features/workspace/shared/filters/workspaceFilterUtils";

import {
  filterTaskQueueTasks,
  formatSubsystemNames,
  formatTaskQueueAssignees,
  readTaskSubsystemIds,
} from "../taskQueueKanbanCard";
import { getTaskQueueDisciplineIcon } from "../taskQueueDisciplineBadge";
import {
  TASK_QUEUE_LAZY_LOAD_BATCH_SIZE,
  getTaskQueueBoardState,
  getTaskQueueBoardStateSortValue,
} from "../taskQueueKanbanBoardState";
import type { TaskQueueBoardState } from "../taskQueueKanbanBoardState";
import type { TaskSortField } from "../taskQueueViewState";

const SUBSYSTEM_ITERATION_DISCIPLINE_CODES = new Set<string>([
  "design",
  "manufacturing",
  "assembly",
  "electrical",
]);

const PRIORITY_VALUES: Record<TaskRecord["priority"], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function buildLookupMap<T extends { id: string }>(items: T[]) {
  return Object.fromEntries(items.map((item) => [item.id, item])) as Record<string, T>;
}

function useTaskQueueVisibleTaskCountReset(
  processedTasksLength: number,
  setVisibleTaskCount: Dispatch<SetStateAction<number>>,
) {
  useEffect(() => {
    setVisibleTaskCount(TASK_QUEUE_LAZY_LOAD_BATCH_SIZE);
  }, [processedTasksLength, setVisibleTaskCount]);
}

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
  const projectsById = useMemo(
    () => buildLookupMap(bootstrap.projects),
    [bootstrap.projects],
  );
  const workstreamsById = useMemo(
    () => buildLookupMap(bootstrap.workstreams),
    [bootstrap.workstreams],
  );
  const subsystemFilterOptions = useMemo(
    () =>
      bootstrap.subsystems.map((subsystem) => ({
        id: subsystem.id,
        name: `${subsystem.name} (${formatIterationVersion(subsystem.iteration)})`,
      })),
    [bootstrap.subsystems],
  );
  const disciplineOptions = useMemo(
    () =>
      bootstrap.disciplines.map((discipline) => ({
        id: discipline.id,
        name: discipline.name,
        icon: getTaskQueueDisciplineIcon(discipline.code),
      })),
    [bootstrap.disciplines],
  );
  const subsystemIterationOptions = useMemo(() => {
    const uniqueIterations = Array.from(
      new Set(bootstrap.subsystems.map((subsystem) => subsystem.iteration)),
    ).sort((left, right) => left - right);

    return uniqueIterations.map((iteration) => ({
      id: `${iteration}`,
      name: formatIterationVersion(iteration),
    }));
  }, [bootstrap.subsystems]);
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

  useEffect(() => {
    if (!isAllProjectsView && projectFilter.length > 0) {
      setProjectFilter([]);
    }
  }, [isAllProjectsView, projectFilter, setProjectFilter]);

  useEffect(() => {
    const projectIds = new Set(bootstrap.projects.map((project) => project.id));
    if (projectFilter.some((projectId) => !projectIds.has(projectId))) {
      setProjectFilter((current) => current.filter((projectId) => projectIds.has(projectId)));
    }
  }, [bootstrap.projects, projectFilter, setProjectFilter]);

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

  const processedTasks = useMemo(() => {
    const filteredTasks = filterTaskQueueTasks(bootstrap.tasks, bootstrap, {
      activePersonFilter,
      disciplineFilter,
      isAllProjectsView,
      ownerFilter,
      priorityFilter,
      projectFilter,
      searchFilter,
      statusFilter,
      subsystemFilter,
      subsystemIterationFilter,
      showSubsystemIterationFilter,
      subsystemsById,
    });

    const readSortValue = (task: TaskRecord): number | string => {
      if (sortField === "priority") {
        return PRIORITY_VALUES[task.priority] ?? 0;
      }
      if (sortField === "status") {
        return getTaskQueueBoardStateSortValue(getTaskQueueBoardState(task, bootstrap));
      }
      if (sortField === "subsystemId") {
        return formatSubsystemNames(readTaskSubsystemIds(task), subsystemsById, "");
      }
      if (sortField === "disciplineId") {
        return task.disciplineId ? disciplinesById[task.disciplineId]?.name ?? "" : "";
      }
      if (sortField === "projectId") {
        return projectsById[task.projectId]?.name ?? "";
      }
      if (sortField === "ownerId") {
        return formatTaskQueueAssignees(task, membersById);
      }
      if (sortField === "title") {
        return task.title.toLowerCase();
      }
      return task.dueDate;
    };

    return filteredTasks.sort((left, right) => {
      const leftValue = readSortValue(left);
      const rightValue = readSortValue(right);

      if (leftValue < rightValue) {
        return sortOrder === "asc" ? -1 : 1;
      }
      if (leftValue > rightValue) {
        return sortOrder === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [
    activePersonFilter,
    bootstrap,
    disciplineFilter,
    disciplinesById,
    isAllProjectsView,
    membersById,
    ownerFilter,
    priorityFilter,
    projectFilter,
    projectsById,
    searchFilter,
    sortField,
    sortOrder,
    statusFilter,
    subsystemFilter,
    subsystemIterationFilter,
    showSubsystemIterationFilter,
    subsystemsById,
  ]);

  useTaskQueueVisibleTaskCountReset(processedTasks.length, setVisibleTaskCount);

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
