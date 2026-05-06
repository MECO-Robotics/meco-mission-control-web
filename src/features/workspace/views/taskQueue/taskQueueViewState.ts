import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";

import {
  useTaskQueueViewStateLogic,
  type TaskQueueViewStateLogicArgs,
} from "./state/taskQueueViewStateLogic";
import type { TaskQueueBoardState } from "./taskQueueKanbanBoardState";
import { TASK_QUEUE_LAZY_LOAD_BATCH_SIZE } from "./taskQueueKanbanBoardState";

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

export const TASK_QUEUE_ZOOM_MIN = 0.6;
export const TASK_QUEUE_ZOOM_MAX = 1.6;
export const TASK_QUEUE_ZOOM_STEP = 0.1;
export const TASK_QUEUE_COMPACT_ZOOM_THRESHOLD = 0.9;

export function clampTaskQueueZoom(value: number) {
  const normalizedValue = Math.round(value * 10) / 10;
  return Math.min(TASK_QUEUE_ZOOM_MAX, Math.max(TASK_QUEUE_ZOOM_MIN, normalizedValue));
}

export function formatTaskQueueZoomLabel(zoom: number) {
  return `${Math.round(zoom * 100)}%`;
}

export function shouldHideTaskQueueSummary(zoom: number) {
  return zoom <= TASK_QUEUE_COMPACT_ZOOM_THRESHOLD;
}

const FILTER_TONE_CLASSES = [
  "filter-tone-info",
  "filter-tone-success",
  "filter-tone-warning",
  "filter-tone-danger",
  "filter-tone-neutral",
] as const;

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
  disciplineFilter: FilterSelection;
  disciplineOptions: DropdownOption[];
  focusedBoardState: TaskQueueBoardState | null;
  ownerFilter: FilterSelection;
  priorityFilter: FilterSelection;
  processedTasks: BootstrapPayload["tasks"];
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
  setTaskQueueZoom: Dispatch<SetStateAction<number>>;
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
  taskQueueZoom: number;
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
  const [taskQueueZoom, setTaskQueueZoom] = useState(1);

  const derived = useTaskQueueViewStateLogic({
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
  } satisfies TaskQueueViewStateLogicArgs);

  return {
    ...derived,
    disciplineFilter,
    focusedBoardState,
    ownerFilter,
    priorityFilter,
    projectFilter,
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
    setTaskQueueZoom,
    setVisibleTaskCount,
    sortField,
    sortOrder,
    statusFilter,
    subsystemFilter,
    subsystemIterationFilter,
    taskQueueZoom,
    visibleTaskCount,
  };
}
