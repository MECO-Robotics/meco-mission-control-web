import { useMemo } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import { formatIterationVersion } from "@/lib/appUtils/common";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { indexRecordsById } from "@/features/workspace/shared/model/indexRecordsById";

import {
  filterTaskQueueTasks,
  formatSubsystemNames,
  formatTaskQueueAssignees,
  readTaskSubsystemIds,
} from "../taskQueueKanbanCard";
import { getTaskQueueDisciplineIcon } from "../taskQueueDisciplineBadge";
import { getTaskQueueBoardState, getTaskQueueBoardStateSortValue } from "../taskQueueKanbanBoardState";
import type { TaskSortField } from "../taskQueueViewState";

const PRIORITY_VALUES: Record<TaskRecord["priority"], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function useTaskQueueProcessedTasks({
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
}: {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  disciplineFilter: FilterSelection;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  isAllProjectsView: boolean;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  ownerFilter: FilterSelection;
  priorityFilter: FilterSelection;
  projectFilter: FilterSelection;
  searchFilter: string;
  sortField: TaskSortField;
  sortOrder: "asc" | "desc";
  statusFilter: FilterSelection;
  subsystemFilter: FilterSelection;
  subsystemIterationFilter: FilterSelection;
  showSubsystemIterationFilter: boolean;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
}) {
  const projectsById = useMemo(() => indexRecordsById(bootstrap.projects), [bootstrap.projects]);
  const workstreamsById = useMemo(() => indexRecordsById(bootstrap.workstreams), [bootstrap.workstreams]);
  const subsystemFilterOptions = useMemo(
    () => bootstrap.subsystems.map((subsystem) => ({
      id: subsystem.id,
      name: `${subsystem.name} (${formatIterationVersion(subsystem.iteration)})`,
    })),
    [bootstrap.subsystems],
  );
  const disciplineOptions = useMemo(
    () => bootstrap.disciplines.map((discipline) => ({
      id: discipline.id,
      name: discipline.name,
      icon: getTaskQueueDisciplineIcon(discipline.code),
    })),
    [bootstrap.disciplines],
  );
  const subsystemIterationOptions = useMemo(() => {
    const iterations = Array.from(new Set(bootstrap.subsystems.map(({ iteration }) => iteration)))
      .sort((left, right) => left - right);
    return iterations.map((iteration) => ({ id: `${iteration}`, name: formatIterationVersion(iteration) }));
  }, [bootstrap.subsystems]);
  const processedTasks = useMemo(() => {
    const filtered = filterTaskQueueTasks(bootstrap.tasks, bootstrap, {
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
    const sortValue = (task: TaskRecord): number | string => {
      if (sortField === "priority") return PRIORITY_VALUES[task.priority] ?? 0;
      if (sortField === "status") return getTaskQueueBoardStateSortValue(getTaskQueueBoardState(task, bootstrap));
      if (sortField === "subsystemId") return formatSubsystemNames(readTaskSubsystemIds(task), subsystemsById, "");
      if (sortField === "disciplineId") return task.disciplineId ? disciplinesById[task.disciplineId]?.name ?? "" : "";
      if (sortField === "projectId") return projectsById[task.projectId]?.name ?? "";
      if (sortField === "ownerId") return formatTaskQueueAssignees(task, membersById);
      if (sortField === "title") return task.title.toLowerCase();
      return task.dueDate;
    };

    return filtered.sort((left, right) => {
      const leftValue = sortValue(left);
      const rightValue = sortValue(right);
      if (leftValue === rightValue) return 0;
      const order = leftValue < rightValue ? -1 : 1;
      return sortOrder === "asc" ? order : -order;
    });
  }, [
    activePersonFilter, bootstrap, disciplineFilter, disciplinesById, isAllProjectsView,
    membersById, ownerFilter, priorityFilter, projectFilter, projectsById, searchFilter,
    sortField, sortOrder, statusFilter, subsystemFilter, subsystemIterationFilter,
    showSubsystemIterationFilter, subsystemsById,
  ]);

  return { disciplineOptions, processedTasks, projectsById, subsystemFilterOptions, subsystemIterationOptions, workstreamsById };
}
