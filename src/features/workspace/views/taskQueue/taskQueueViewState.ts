import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { BootstrapPayload, TaskRecord } from "@/types";
import { formatIterationVersion } from "@/lib/appUtils";
import type { DropdownOption } from "@/features/workspace/shared/workspaceTypes";
import {
  filterSelectionIncludes,
  filterSelectionIntersects,
  filterSelectionMatchesTaskPeople,
  formatFilterSelectionLabel,
  type FilterSelection,
  useFilterChangeMotionClass,
} from "@/features/workspace/shared/workspaceFilterUtils";
import {
  formatSubsystemNames,
  formatTaskQueueAssignees,
  getTaskQueueBoardState,
  getTaskQueueBoardStateSortValue,
  readTaskAssigneeIds,
  readTaskSubsystemIds,
  TASK_QUEUE_LAZY_LOAD_BATCH_SIZE,
  type TaskQueueBoardState,
} from "./taskQueueKanban";

export type TaskSortField =
  | "disciplineId"
  | "dueDate"
  | "ownerId"
  | "priority"
  | "projectId"
  | "status"
  | "subsystemId"
  | "title";

export const TASK_SORT_OPTIONS: DropdownOption[] = [
  { id: "projectId", name: "Project" },
  { id: "title", name: "Task" },
  { id: "disciplineId", name: "Discipline" },
  { id: "subsystemId", name: "Subsystem" },
  { id: "ownerId", name: "Assigned" },
  { id: "status", name: "Status" },
  { id: "dueDate", name: "Due" },
  { id: "priority", name: "Priority" },
];

export const SORT_DIRECTION_OPTIONS: DropdownOption[] = [
  { id: "asc", name: "Ascending" },
  { id: "desc", name: "Descending" },
];

const FILTER_TONE_CLASSES = [
  "filter-tone-info",
  "filter-tone-success",
  "filter-tone-warning",
  "filter-tone-danger",
  "filter-tone-neutral",
] as const;

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

function getStableToneClassName(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return FILTER_TONE_CLASSES[hash % FILTER_TONE_CLASSES.length];
}

export function getTaskQueueStatusToneClassName(value: string) {
  switch (value) {
    case "in-progress":
    case "waiting-on-dependency":
      return "filter-tone-warning";
    case "waiting-for-qa":
      return "filter-tone-info";
    case "complete":
      return "filter-tone-success";
    case "blocked":
      return "filter-tone-danger";
    case "not-started":
    default:
      return "filter-tone-neutral";
  }
}

export function getTaskQueueFilterToneClassName(value: string) {
  return getStableToneClassName(value);
}

export interface TaskQueueViewStateArgs {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  isAllProjectsView: boolean;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
}

export interface TaskQueueViewState {
  activeFilterCount: number;
  activePersonFilterLabel: string;
  disciplineFilter: FilterSelection;
  disciplineOptions: DropdownOption[];
  focusedBoardState: TaskQueueBoardState | null;
  ownerFilter: FilterSelection;
  priorityFilter: FilterSelection;
  processedTasks: TaskRecord[];
  projectFilter: FilterSelection;
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
  searchFilter: string;
  setDisciplineFilter: Dispatch<SetStateAction<FilterSelection>>;
  setFocusedBoardState: Dispatch<SetStateAction<TaskQueueBoardState | null>>;
  setOwnerFilter: Dispatch<SetStateAction<FilterSelection>>;
  setPriorityFilter: Dispatch<SetStateAction<FilterSelection>>;
  setProjectFilter: Dispatch<SetStateAction<FilterSelection>>;
  setSearchFilter: Dispatch<SetStateAction<string>>;
  setSortField: Dispatch<SetStateAction<TaskSortField>>;
  setSortOrder: Dispatch<SetStateAction<"asc" | "desc">>;
  setStatusFilter: Dispatch<SetStateAction<FilterSelection>>;
  setSubsystemFilter: Dispatch<SetStateAction<FilterSelection>>;
  setSubsystemIterationFilter: Dispatch<SetStateAction<FilterSelection>>;
  setVisibleTaskCount: Dispatch<SetStateAction<number>>;
  sortField: TaskSortField;
  sortOrder: "asc" | "desc";
  statusFilter: FilterSelection;
  subsystemFilter: FilterSelection;
  subsystemFilterOptions: DropdownOption[];
  subsystemIterationFilter: FilterSelection;
  subsystemIterationOptions: DropdownOption[];
  taskFilterMotionClass: string;
  taskSortIsDefault: boolean;
  visibleTaskCount: number;
  workstreamsById: Record<string, BootstrapPayload["workstreams"][number]>;
  showProjectContextOnCards: boolean;
  showProjectOnCards: boolean;
  showSubsystemIterationFilter: boolean;
}

export function useTaskQueueViewState({
  activePersonFilter,
  bootstrap,
  disciplinesById,
  isAllProjectsView,
  membersById,
  subsystemsById,
}: TaskQueueViewStateArgs): TaskQueueViewState {
  const [sortField, setSortField] = useState<TaskSortField>("dueDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [projectFilter, setProjectFilter] = useState<FilterSelection>([]);
  const [statusFilter, setStatusFilter] = useState<FilterSelection>([]);
  const [disciplineFilter, setDisciplineFilter] = useState<FilterSelection>([]);
  const [subsystemFilter, setSubsystemFilter] = useState<FilterSelection>([]);
  const [subsystemIterationFilter, setSubsystemIterationFilter] = useState<FilterSelection>([]);
  const [ownerFilter, setOwnerFilter] = useState<FilterSelection>([]);
  const [priorityFilter, setPriorityFilter] = useState<FilterSelection>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [focusedBoardState, setFocusedBoardState] = useState<TaskQueueBoardState | null>(null);
  const [visibleTaskCount, setVisibleTaskCount] = useState(TASK_QUEUE_LAZY_LOAD_BATCH_SIZE);

  const projectsById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.projects.map((project) => [project.id, project]),
      ) as Record<string, BootstrapPayload["projects"][number]>,
    [bootstrap.projects],
  );
  const workstreamsById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.workstreams.map((workstream) => [workstream.id, workstream]),
      ) as Record<string, BootstrapPayload["workstreams"][number]>,
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
  }, [
    bootstrap.mechanisms,
    bootstrap.tasks,
    disciplinesById,
    selectedSubsystemId,
  ]);

  useEffect(() => {
    if (!isAllProjectsView && projectFilter.length > 0) {
      setProjectFilter([]);
    }
  }, [isAllProjectsView, projectFilter]);

  useEffect(() => {
    const projectIds = new Set(bootstrap.projects.map((project) => project.id));
    if (projectFilter.some((projectId) => !projectIds.has(projectId))) {
      setProjectFilter((current) => current.filter((projectId) => projectIds.has(projectId)));
    }
  }, [bootstrap.projects, projectFilter]);

  useEffect(() => {
    if (!showSubsystemIterationFilter && subsystemIterationFilter.length > 0) {
      setSubsystemIterationFilter([]);
    }
  }, [showSubsystemIterationFilter, subsystemIterationFilter]);

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
  }, [bootstrap, focusedBoardState]);

  useEffect(() => {
    if (focusedBoardState === null || typeof document === "undefined") {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFocusedBoardState(null);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [focusedBoardState]);

  const activePersonFilterLabel = formatFilterSelectionLabel(
    "All roster",
    bootstrap.members,
    activePersonFilter,
  );

  const processedTasks = useMemo(() => {
    let result = [...bootstrap.tasks];

    if (activePersonFilter.length > 0) {
      result = result.filter((task) => filterSelectionMatchesTaskPeople(activePersonFilter, task));
    }
    if (isAllProjectsView && projectFilter.length > 0) {
      result = result.filter((task) => filterSelectionIncludes(projectFilter, task.projectId));
    }
    if (statusFilter.length > 0) {
      result = result.filter((task) =>
        filterSelectionIncludes(statusFilter, getTaskQueueBoardState(task, bootstrap)),
      );
    }
    if (disciplineFilter.length > 0) {
      result = result.filter((task) =>
        filterSelectionIncludes(disciplineFilter, task.disciplineId),
      );
    }
    if (subsystemFilter.length > 0) {
      result = result.filter((task) =>
        filterSelectionIntersects(subsystemFilter, readTaskSubsystemIds(task)),
      );
    }
    if (showSubsystemIterationFilter && subsystemIterationFilter.length > 0) {
      result = result.filter((task) =>
        readTaskSubsystemIds(task).some((subsystemId) => {
          const subsystemIteration = subsystemsById[subsystemId]?.iteration;

          return (
            typeof subsystemIteration === "number" &&
            subsystemIterationFilter.includes(`${subsystemIteration}`)
          );
        }),
      );
    }
    if (ownerFilter.length > 0) {
      result = result.filter((task) =>
        readTaskAssigneeIds(task).some((assigneeId) => ownerFilter.includes(assigneeId)),
      );
    }
    if (priorityFilter.length > 0) {
      result = result.filter((task) => filterSelectionIncludes(priorityFilter, task.priority));
    }
    if (searchFilter.trim() !== "") {
      const search = searchFilter.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(search) ||
          task.summary.toLowerCase().includes(search),
      );
    }

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

    return result.sort((left, right) => {
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

  useEffect(() => {
    setVisibleTaskCount(TASK_QUEUE_LAZY_LOAD_BATCH_SIZE);
  }, [processedTasks.length]);

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
    activePersonFilterLabel,
    disciplineFilter,
    disciplineOptions,
    focusedBoardState,
    ownerFilter,
    priorityFilter,
    processedTasks,
    projectFilter,
    projectsById,
    searchFilter,
    setDisciplineFilter,
    setFocusedBoardState,
    setOwnerFilter,
    setPriorityFilter,
    setProjectFilter,
    setSearchFilter,
    setSortField,
    setSortOrder,
    setStatusFilter,
    setSubsystemFilter,
    setSubsystemIterationFilter,
    setVisibleTaskCount,
    sortField,
    sortOrder,
    statusFilter,
    subsystemFilter,
    subsystemFilterOptions,
    subsystemIterationFilter,
    subsystemIterationOptions,
    taskFilterMotionClass,
    taskSortIsDefault: sortField === "dueDate" && sortOrder === "asc",
    visibleTaskCount,
    workstreamsById,
    showProjectContextOnCards: !isAllProjectsView,
    showProjectOnCards: isAllProjectsView && projectFilter.length === 0,
    showSubsystemIterationFilter,
  };
}
