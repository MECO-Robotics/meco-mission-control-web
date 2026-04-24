import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { formatDate } from "@/lib/appUtils";
import type { BootstrapPayload, TaskRecord } from "@/types";
import {
  IconManufacturing,
  IconParts,
  IconPerson,
  IconTasks,
} from "@/components/shared";
import {
  EditableHoverIndicator,
  FilterDropdown,
  PaginationControls,
  SearchToolbarInput,
  TableCell,
  useWorkspacePagination,
} from "@/features/workspace/shared";
import { getStatusPillClassName } from "@/features/workspace/shared";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared";
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from "@/features/workspace/shared";

type TaskSortField =
  | "dueDate"
  | "ownerId"
  | "priority"
  | "projectId"
  | "status"
  | "subsystemId"
  | "title";

interface TaskQueueViewProps {
  activePersonFilter: string;
  bootstrap: BootstrapPayload;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  eventsById: Record<string, BootstrapPayload["events"][number]>;
  isAllProjectsView: boolean;
  mechanismsById: Record<string, BootstrapPayload["mechanisms"][number]>;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  openCreateTaskModal: () => void;
  openEditTaskModal: (task: TaskRecord) => void;
  partDefinitionsById: Record<string, BootstrapPayload["partDefinitions"][number]>;
  partInstancesById: Record<string, BootstrapPayload["partInstances"][number]>;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
}

export function TaskQueueView({
  activePersonFilter,
  bootstrap,
  disciplinesById,
  eventsById,
  isAllProjectsView,
  mechanismsById,
  membersById,
  openCreateTaskModal,
  openEditTaskModal,
  partDefinitionsById,
  partInstancesById,
  subsystemsById,
}: TaskQueueViewProps) {
  const [sortField, setSortField] = useState<TaskSortField>("dueDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subsystemFilter, setSubsystemFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchFilter, setSearchFilter] = useState("");

  const projectsById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.projects.map((project) => [project.id, project]),
      ) as Record<string, BootstrapPayload["projects"][number]>,
    [bootstrap.projects],
  );

  useEffect(() => {
    if (!isAllProjectsView && projectFilter !== "all") {
      setProjectFilter("all");
    }
  }, [isAllProjectsView, projectFilter]);

  useEffect(() => {
    if (
      projectFilter !== "all" &&
      !bootstrap.projects.some((project) => project.id === projectFilter)
    ) {
      setProjectFilter("all");
    }
  }, [bootstrap.projects, projectFilter]);

  const showProjectCol = isAllProjectsView && projectFilter === "all";
  const showSubsystemCol = subsystemFilter === "all";
  const showOwnerCol = ownerFilter === "all";
  const showStatusCol = statusFilter === "all";
  const showPriorityCol = priorityFilter === "all";

  const gridTemplate = [
    showProjectCol ? "1fr" : null,
    "minmax(200px, 2.5fr)",
    showSubsystemCol ? "1fr" : null,
    showOwnerCol ? "1fr" : null,
    showStatusCol ? "1fr" : null,
    "1fr",
    showPriorityCol ? "1fr" : null,
  ]
    .filter(Boolean)
    .join(" ");

  const processedTasks = useMemo(() => {
    let result = [...bootstrap.tasks];

    if (isAllProjectsView && projectFilter !== "all") {
      result = result.filter((task) => task.projectId === projectFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter((task) => task.status === statusFilter);
    }
    if (subsystemFilter !== "all") {
      result = result.filter((task) => task.subsystemId === subsystemFilter);
    }
    if (ownerFilter !== "all") {
      result = result.filter((task) => task.ownerId === ownerFilter);
    }
    if (priorityFilter !== "all") {
      result = result.filter((task) => task.priority === priorityFilter);
    }
    if (searchFilter.trim() !== "") {
      const search = searchFilter.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(search) ||
          task.summary.toLowerCase().includes(search),
      );
    }

    const priorityValues: Record<string, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    const statusValues: Record<string, number> = {
      "not-started": 1,
      "in-progress": 2,
      "waiting-for-qa": 3,
      complete: 4,
    };

    const readSortValue = (task: TaskRecord): number | string => {
      if (sortField === "priority") {
        return priorityValues[task.priority] ?? 0;
      }
      if (sortField === "status") {
        return statusValues[task.status] ?? 0;
      }
      if (sortField === "subsystemId") {
        return subsystemsById[task.subsystemId]?.name ?? "";
      }
      if (sortField === "projectId") {
        return projectsById[task.projectId]?.name ?? "";
      }
      if (sortField === "ownerId") {
        return membersById[task.ownerId ?? ""]?.name ?? "";
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
    bootstrap.tasks,
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
    subsystemsById,
  ]);
  const taskPagination = useWorkspacePagination(processedTasks);

  const toggleSort = (field: TaskSortField) => {
    if (sortField === field) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortOrder("asc");
  };

  const getSortIcon = (field: TaskSortField) => {
    if (sortField !== field) {
      return null;
    }

    return sortOrder === "asc" ? " ^" : " v";
  };

  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Task queue</h2>
          <p className="section-copy filter-copy">
            {activePersonFilter === "all"
              ? "All tasks in queue."
              : `Only tasks owned by or mentored by ${membersById[activePersonFilter]?.name ?? "selected person"}.`}
          </p>
        </div>
        <div className="panel-actions filter-toolbar task-queue-toolbar">
          <SearchToolbarInput
            ariaLabel="Search tasks"
            onChange={setSearchFilter}
            placeholder="Search tasks..."
            value={searchFilter}
          />

          {isAllProjectsView ? (
            <FilterDropdown
              allLabel="All projects"
              ariaLabel="Filter tasks by project"
              icon={<IconParts />}
              onChange={setProjectFilter}
              options={bootstrap.projects}
              value={projectFilter}
            />
          ) : null}

          <FilterDropdown
            allLabel="All subsystems"
            ariaLabel="Filter tasks by subsystem"
            icon={<IconManufacturing />}
            onChange={setSubsystemFilter}
            options={bootstrap.subsystems}
            value={subsystemFilter}
          />

          <FilterDropdown
            allLabel="All owners"
            ariaLabel="Filter tasks by owner"
            icon={<IconPerson />}
            onChange={setOwnerFilter}
            options={bootstrap.members}
            value={ownerFilter}
          />

          <FilterDropdown
            allLabel="All statuses"
            ariaLabel="Filter tasks by status"
            icon={<IconTasks />}
            onChange={setStatusFilter}
            options={TASK_STATUS_OPTIONS}
            value={statusFilter}
          />

          <FilterDropdown
            allLabel="All priorities"
            ariaLabel="Filter tasks by priority"
            icon={<IconTasks />}
            onChange={setPriorityFilter}
            options={TASK_PRIORITY_OPTIONS}
            value={priorityFilter}
          />

          <button
            aria-label="Add task"
            className="primary-action queue-toolbar-action"
            onClick={openCreateTaskModal}
            title="Add task"
            type="button"
          >
            Add
          </button>
        </div>
      </div>

      <div className="table-shell">
        <div
          className="queue-table queue-table-header"
          style={{ "--workspace-grid-template": gridTemplate } as CSSProperties}
        >
          {showProjectCol ? (
            <button className="table-sort-button" onClick={() => toggleSort("projectId")} type="button">
              Project{getSortIcon("projectId")}
            </button>
          ) : null}
          <button className="table-sort-button" onClick={() => toggleSort("title")} type="button">
            Task{getSortIcon("title")}
          </button>
          {showSubsystemCol ? (
            <button className="table-sort-button" onClick={() => toggleSort("subsystemId")} type="button">
              Subsystem{getSortIcon("subsystemId")}
            </button>
          ) : null}
          {showOwnerCol ? (
            <button className="table-sort-button" onClick={() => toggleSort("ownerId")} type="button">
              Owner{getSortIcon("ownerId")}
            </button>
          ) : null}
          {showStatusCol ? (
            <button className="table-sort-button" onClick={() => toggleSort("status")} type="button">
              Status{getSortIcon("status")}
            </button>
          ) : null}
          <button className="table-sort-button" onClick={() => toggleSort("dueDate")} type="button">
            Due{getSortIcon("dueDate")}
          </button>
          {showPriorityCol ? (
            <button className="table-sort-button" onClick={() => toggleSort("priority")} type="button">
              Priority{getSortIcon("priority")}
            </button>
          ) : null}
        </div>

        {taskPagination.pageItems.map((task) => {
          const linkedPart = task.partInstanceId
            ? partInstancesById[task.partInstanceId]?.name ??
            partDefinitionsById[partInstancesById[task.partInstanceId]?.partDefinitionId ?? ""]?.name
            : null;

          return (
            <button
              className="queue-table queue-row editable-hover-target editable-hover-target-row"
              key={task.id}
              onClick={() => openEditTaskModal(task)}
              style={{ "--workspace-grid-template": gridTemplate } as CSSProperties}
              type="button"
            >
              {showProjectCol ? (
                <TableCell label="Project">
                  {projectsById[task.projectId]?.name ?? "Unknown"}
                </TableCell>
              ) : null}
              <span
                className="queue-title table-cell table-cell-primary queue-title-stack"
                data-label="Task"
              >
                <strong>{task.title}</strong>
                <small>{task.summary}</small>
                <small>
                  {(task.disciplineId ? disciplinesById[task.disciplineId]?.name : null) ?? "No discipline"}
                  {" / "}
                  {(task.mechanismId ? mechanismsById[task.mechanismId]?.name : null) ?? "No mechanism"}
                  {" / "}
                  {linkedPart ?? "No part"}
                  {task.targetEventId
                    ? ` / target ${eventsById[task.targetEventId]?.title ?? "event"}`
                    : ""}
                </small>
              </span>
              {showSubsystemCol ? (
                <TableCell label="Subsystem">
                  {(task.subsystemId ? subsystemsById[task.subsystemId]?.name : null) ?? "Unknown"}
                </TableCell>
              ) : null}
              {showOwnerCol ? (
                <TableCell label="Owner">
                  {(task.ownerId ? membersById[task.ownerId]?.name : null) ?? "Unassigned"}
                </TableCell>
              ) : null}
              {showStatusCol ? (
                <TableCell label="Status" valueClassName="table-cell-pill">
                  <span className={getStatusPillClassName(task.status)}>{task.status.replace("-", " ")}</span>
                </TableCell>
              ) : null}
              <TableCell label="Due">{formatDate(task.dueDate)}</TableCell>
              {showPriorityCol ? (
                <TableCell label="Priority" valueClassName="table-cell-pill">
                  <span className={getStatusPillClassName(task.priority)}>{task.priority}</span>
                </TableCell>
              ) : null}
              <EditableHoverIndicator />
            </button>
          );
        })}

        {processedTasks.length === 0 ? <p className="empty-state">No tasks match the current filters.</p> : null}
        <PaginationControls
          label="tasks"
          onPageChange={taskPagination.setPage}
          onPageSizeChange={taskPagination.setPageSize}
          page={taskPagination.page}
          pageSize={taskPagination.pageSize}
          pageSizeOptions={taskPagination.pageSizeOptions}
          rangeEnd={taskPagination.rangeEnd}
          rangeStart={taskPagination.rangeStart}
          totalItems={taskPagination.totalItems}
          totalPages={taskPagination.totalPages}
        />
      </div>
    </section>
  );
}




