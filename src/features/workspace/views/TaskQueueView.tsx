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
  ColumnFilterDropdown,
  EditableHoverIndicator,
  type FilterSelection,
  FilterDropdown,
  PaginationControls,
  SearchToolbarInput,
  TableCell,
  filterSelectionIncludes,
  filterSelectionIntersects,
  filterSelectionMatchesTaskPeople,
  formatFilterSelectionLabel,
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
  activePersonFilter: FilterSelection;
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

function formatNames(
  ids: string[],
  lookup: Record<string, { name?: string }>,
  fallback: string,
) {
  if (ids.length === 0) {
    return fallback;
  }

  return ids.map((id) => lookup[id]?.name ?? "Unknown").join(", ");
}

function readTaskAssigneeIds(task: TaskRecord) {
  const assigneeIds = Array.isArray(task.assigneeIds) ? task.assigneeIds : [];

  return assigneeIds.length > 0
    ? assigneeIds
    : task.ownerId
      ? [task.ownerId]
      : [];
}

function formatTaskAssignees(
  task: TaskRecord,
  membersById: Record<string, BootstrapPayload["members"][number]>,
) {
  return formatNames(readTaskAssigneeIds(task), membersById, "Unassigned");
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
  const [projectFilter, setProjectFilter] = useState<FilterSelection>([]);
  const [statusFilter, setStatusFilter] = useState<FilterSelection>([]);
  const [subsystemFilter, setSubsystemFilter] = useState<FilterSelection>([]);
  const [ownerFilter, setOwnerFilter] = useState<FilterSelection>([]);
  const [priorityFilter, setPriorityFilter] = useState<FilterSelection>([]);
  const [searchFilter, setSearchFilter] = useState("");

  const projectsById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.projects.map((project) => [project.id, project]),
      ) as Record<string, BootstrapPayload["projects"][number]>,
    [bootstrap.projects],
  );

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

  const showProjectCol = isAllProjectsView;
  const showSubsystemCol = true;
  const showOwnerCol = true;
  const showStatusCol = true;
  const showPriorityCol = true;
  const activePersonFilterLabel = formatFilterSelectionLabel(
    "All roster",
    bootstrap.members,
    activePersonFilter,
  );

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

    if (activePersonFilter.length > 0) {
      result = result.filter((task) => filterSelectionMatchesTaskPeople(activePersonFilter, task));
    }
    if (isAllProjectsView && projectFilter.length > 0) {
      result = result.filter((task) => filterSelectionIncludes(projectFilter, task.projectId));
    }
    if (statusFilter.length > 0) {
      result = result.filter((task) => filterSelectionIncludes(statusFilter, task.status));
    }
    if (subsystemFilter.length > 0) {
      result = result.filter((task) =>
        filterSelectionIntersects(
          subsystemFilter,
          Array.from(new Set([task.subsystemId, ...task.subsystemIds].filter(Boolean))),
        ),
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
        return formatNames(task.subsystemIds, subsystemsById, "");
      }
      if (sortField === "projectId") {
        return projectsById[task.projectId]?.name ?? "";
      }
      if (sortField === "ownerId") {
        return formatTaskAssignees(task, membersById);
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
      return "";
    }

    return sortOrder === "asc" ? "^" : "v";
  };

  const renderSortLabel = (field: TaskSortField, label: string) => {
    const sortIcon = getSortIcon(field);

    return (
      <>
        <span aria-hidden="true" className="table-sort-arrow">
          {sortIcon}
        </span>
        <span>{label}</span>
      </>
    );
  };

  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Task queue</h2>
          <p className="section-copy filter-copy">
            {activePersonFilter.length === 0
              ? "All tasks in queue."
              : `Only tasks assigned to or mentored by ${activePersonFilterLabel}.`}
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
              className="mobile-filter-control"
              icon={<IconParts />}
              onChange={setProjectFilter}
              options={bootstrap.projects}
              value={projectFilter}
            />
          ) : null}

          <FilterDropdown
            allLabel="All subsystems"
            ariaLabel="Filter tasks by subsystem"
            className="mobile-filter-control"
            icon={<IconManufacturing />}
            onChange={setSubsystemFilter}
            options={bootstrap.subsystems}
            value={subsystemFilter}
          />

          <FilterDropdown
            allLabel="All assignees"
            ariaLabel="Filter tasks by assigned student"
            className="mobile-filter-control"
            icon={<IconPerson />}
            onChange={setOwnerFilter}
            options={bootstrap.members}
            value={ownerFilter}
          />

          <FilterDropdown
            allLabel="All statuses"
            ariaLabel="Filter tasks by status"
            className="mobile-filter-control"
            icon={<IconTasks />}
            onChange={setStatusFilter}
            options={TASK_STATUS_OPTIONS}
            value={statusFilter}
          />

          <FilterDropdown
            allLabel="All priorities"
            ariaLabel="Filter tasks by priority"
            className="mobile-filter-control"
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
            <span className="table-column-header-cell">
              <button className="table-sort-button" onClick={() => toggleSort("projectId")} type="button">
                {renderSortLabel("projectId", "Project")}
              </button>
              <ColumnFilterDropdown
                allLabel="All projects"
                ariaLabel="Filter tasks by project"
                onChange={setProjectFilter}
                options={bootstrap.projects}
                value={projectFilter}
              />
            </span>
          ) : null}
          <button className="table-sort-button" onClick={() => toggleSort("title")} type="button">
            {renderSortLabel("title", "Task")}
          </button>
          {showSubsystemCol ? (
            <span className="table-column-header-cell">
              <button className="table-sort-button" onClick={() => toggleSort("subsystemId")} type="button">
                {renderSortLabel("subsystemId", "Subsystem")}
              </button>
              <ColumnFilterDropdown
                allLabel="All subsystems"
                ariaLabel="Filter tasks by subsystem"
                onChange={setSubsystemFilter}
                options={bootstrap.subsystems}
                value={subsystemFilter}
              />
            </span>
          ) : null}
          {showOwnerCol ? (
            <span className="table-column-header-cell">
              <button className="table-sort-button" onClick={() => toggleSort("ownerId")} type="button">
                {renderSortLabel("ownerId", "Assigned")}
              </button>
              <ColumnFilterDropdown
                allLabel="All assignees"
                ariaLabel="Filter tasks by assigned student"
                onChange={setOwnerFilter}
                options={bootstrap.members}
                value={ownerFilter}
              />
            </span>
          ) : null}
          {showStatusCol ? (
            <span className="table-column-header-cell">
              <button className="table-sort-button" onClick={() => toggleSort("status")} type="button">
                {renderSortLabel("status", "Status")}
              </button>
              <ColumnFilterDropdown
                allLabel="All statuses"
                ariaLabel="Filter tasks by status"
                onChange={setStatusFilter}
                options={TASK_STATUS_OPTIONS}
                value={statusFilter}
              />
            </span>
          ) : null}
          <button className="table-sort-button" onClick={() => toggleSort("dueDate")} type="button">
            {renderSortLabel("dueDate", "Due")}
          </button>
          {showPriorityCol ? (
            <span className="table-column-header-cell">
              <button className="table-sort-button" onClick={() => toggleSort("priority")} type="button">
                {renderSortLabel("priority", "Priority")}
              </button>
              <ColumnFilterDropdown
                allLabel="All priorities"
                ariaLabel="Filter tasks by priority"
                onChange={setPriorityFilter}
                options={TASK_PRIORITY_OPTIONS}
                value={priorityFilter}
              />
            </span>
          ) : null}
        </div>

        {taskPagination.pageItems.map((task) => {
          const linkedPartNames = task.partInstanceIds
            .map((partInstanceId) => {
              const partInstance = partInstancesById[partInstanceId];
              return (
                partInstance?.name ??
                partDefinitionsById[partInstance?.partDefinitionId ?? ""]?.name
              );
            })
            .filter((name): name is string => Boolean(name));

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
                  {formatNames(task.mechanismIds, mechanismsById, "No mechanism")}
                  {" / "}
                  {linkedPartNames.length > 0 ? linkedPartNames.join(", ") : "No part"}
                  {task.targetEventId
                    ? ` / target ${eventsById[task.targetEventId]?.title ?? "event"}`
                    : ""}
                </small>
              </span>
              {showSubsystemCol ? (
                <TableCell label="Subsystem">
                  {formatNames(task.subsystemIds, subsystemsById, "Unknown")}
                </TableCell>
              ) : null}
              {showOwnerCol ? (
                <TableCell label="Assigned">
                  {formatTaskAssignees(task, membersById)}
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




