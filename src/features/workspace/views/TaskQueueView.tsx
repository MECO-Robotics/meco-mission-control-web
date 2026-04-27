import { useEffect, useMemo, useRef, useState, useId, type CSSProperties } from "react";

import { formatDate, formatIterationVersion } from "@/lib/appUtils";
import type { BootstrapPayload, TaskRecord } from "@/types";
import {
  IconManufacturing,
  IconFilter,
  IconParts,
  IconPerson,
  IconSort,
  IconTasks,
} from "@/components/shared";
import {
  ColumnFilterDropdown,
  CompactFilterMenu,
  EditableHoverIndicator,
  type DropdownOption,
  type FilterSelection,
  FilterDropdown,
  PaginationControls,
  SearchToolbarInput,
  TableCell,
  filterSelectionIncludes,
  filterSelectionIntersects,
  filterSelectionMatchesTaskPeople,
  formatFilterSelectionLabel,
  useFilterChangeMotionClass,
  useWorkspaceCompactMode,
  useWorkspacePagination,
} from "@/features/workspace/shared";
import { getStatusPillClassName } from "@/features/workspace/shared";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared";
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from "@/features/workspace/shared";
import {
  formatTaskPlanningState,
  getTaskPlanningState,
} from "@/features/workspace/shared/taskPlanning";

type TaskSortField =
  | "dueDate"
  | "ownerId"
  | "priority"
  | "projectId"
  | "status"
  | "subsystemId"
  | "title";

const TASK_SORT_OPTIONS: DropdownOption[] = [
  { id: "projectId", name: "Project" },
  { id: "title", name: "Task" },
  { id: "subsystemId", name: "Subsystem" },
  { id: "ownerId", name: "Assigned" },
  { id: "status", name: "Status" },
  { id: "dueDate", name: "Due" },
  { id: "priority", name: "Priority" },
];

const SORT_DIRECTION_OPTIONS: DropdownOption[] = [
  { id: "asc", name: "Ascending" },
  { id: "desc", name: "Descending" },
];

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

function readTaskSubsystemIds(task: TaskRecord) {
  const subsystemIds = Array.isArray(task.subsystemIds) ? task.subsystemIds : [];
  const candidateIds = subsystemIds.length > 0 ? subsystemIds : [task.subsystemId];

  return Array.from(
    new Set(
      candidateIds.filter(
        (subsystemId): subsystemId is string =>
          typeof subsystemId === "string" && subsystemId.length > 0,
      ),
    ),
  );
}

function formatSubsystemNames(
  subsystemIds: string[],
  lookup: Record<string, BootstrapPayload["subsystems"][number]>,
  fallback: string,
) {
  if (subsystemIds.length === 0) {
    return fallback;
  }

  return subsystemIds
    .map((subsystemId) => {
      const subsystem = lookup[subsystemId];
      return subsystem
        ? `${subsystem.name} (${formatIterationVersion(subsystem.iteration)})`
        : "Unknown";
    })
    .join(", ");
}

function formatMechanismNames(
  mechanismIds: string[],
  lookup: Record<string, BootstrapPayload["mechanisms"][number]>,
  fallback: string,
) {
  if (mechanismIds.length === 0) {
    return fallback;
  }

  return mechanismIds
    .map((mechanismId) => {
      const mechanism = lookup[mechanismId];
      return mechanism
        ? `${mechanism.name} (${formatIterationVersion(mechanism.iteration)})`
        : "Unknown";
    })
    .join(", ");
}

function TaskQueueCompactFilterMenu({
  activeFilterCount,
  isAllProjectsView,
  isOpen,
  onClose,
  onToggle,
  projectFilter,
  setPriorityFilter,
  setProjectFilter,
  setStatusFilter,
  setSubsystemFilter,
  setSubsystemIterationFilter,
  setOwnerFilter,
  showSubsystemIterationFilter,
  subsystemFilter,
  subsystemFilterOptions,
  subsystemIterationFilter,
  subsystemIterationOptions,
  ownerFilter,
  priorityFilter,
  statusFilter,
  bootstrap,
}: {
  activeFilterCount: number;
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  ownerFilter: FilterSelection;
  priorityFilter: FilterSelection;
  projectFilter: FilterSelection;
  setPriorityFilter: (value: FilterSelection) => void;
  setProjectFilter: (value: FilterSelection) => void;
  setStatusFilter: (value: FilterSelection) => void;
  setSubsystemFilter: (value: FilterSelection) => void;
  setSubsystemIterationFilter: (value: FilterSelection) => void;
  setOwnerFilter: (value: FilterSelection) => void;
  showSubsystemIterationFilter: boolean;
  statusFilter: FilterSelection;
  subsystemFilter: FilterSelection;
  subsystemFilterOptions: DropdownOption[];
  subsystemIterationFilter: FilterSelection;
  subsystemIterationOptions: DropdownOption[];
}) {
  const menuRef = useRef<HTMLSpanElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Node && !menuRef.current?.contains(target)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <span
      className={`toolbar-filter toolbar-filter-dropdown task-queue-filter-menu${isActiveClass(activeFilterCount)}${isOpen ? " is-open" : ""}`}
      ref={menuRef}
    >
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="toolbar-filter-menu-button task-queue-filter-menu-button"
        onClick={onToggle}
        type="button"
      >
        <span className="toolbar-filter-icon">
          <IconFilter />
        </span>
        <span aria-hidden="true" className="toolbar-filter-value">
          Filters
        </span>
        {activeFilterCount > 0 ? (
          <span aria-hidden="true" className="task-queue-filter-count">
            {activeFilterCount}
          </span>
        ) : null}
        <span aria-hidden="true" className="toolbar-filter-chevron" />
      </button>

      {isOpen ? (
        <div aria-label="Task filters" className="task-queue-filter-menu-popover" id={menuId} role="menu">
          {isAllProjectsView ? (
            <div className="task-queue-filter-menu-item">
              <span className="task-queue-filter-menu-label">Project</span>
              <FilterDropdown
                allLabel="All projects"
                ariaLabel="Filter tasks by project"
                className="task-queue-filter-menu-submenu"
                icon={<IconParts />}
                onChange={setProjectFilter}
                options={bootstrap.projects}
                value={projectFilter}
              />
            </div>
          ) : null}

          <div className="task-queue-filter-menu-item">
            <span className="task-queue-filter-menu-label">Subsystem</span>
            <FilterDropdown
              allLabel="All subsystems"
              ariaLabel="Filter tasks by subsystem"
              className="task-queue-filter-menu-submenu"
              icon={<IconManufacturing />}
              onChange={setSubsystemFilter}
              options={subsystemFilterOptions}
              value={subsystemFilter}
            />
          </div>

          {showSubsystemIterationFilter ? (
            <div className="task-queue-filter-menu-item">
              <span className="task-queue-filter-menu-label">Iteration</span>
              <FilterDropdown
                allLabel="All iterations"
                ariaLabel="Filter tasks by subsystem iteration"
                className="task-queue-filter-menu-submenu"
                icon={<IconManufacturing />}
                onChange={setSubsystemIterationFilter}
                options={subsystemIterationOptions}
                value={subsystemIterationFilter}
              />
            </div>
          ) : null}

          <div className="task-queue-filter-menu-item">
            <span className="task-queue-filter-menu-label">Assignee</span>
            <FilterDropdown
              allLabel="All assignees"
              ariaLabel="Filter tasks by assigned student"
              className="task-queue-filter-menu-submenu"
              icon={<IconPerson />}
              onChange={setOwnerFilter}
              options={bootstrap.members}
              value={ownerFilter}
            />
          </div>

          <div className="task-queue-filter-menu-item">
            <span className="task-queue-filter-menu-label">Status</span>
            <FilterDropdown
              allLabel="All statuses"
              ariaLabel="Filter tasks by status"
              className="task-queue-filter-menu-submenu"
              icon={<IconTasks />}
              onChange={setStatusFilter}
              options={TASK_STATUS_OPTIONS}
              value={statusFilter}
            />
          </div>

          <div className="task-queue-filter-menu-item">
            <span className="task-queue-filter-menu-label">Priority</span>
            <FilterDropdown
              allLabel="All priorities"
              ariaLabel="Filter tasks by priority"
              className="task-queue-filter-menu-submenu"
              icon={<IconTasks />}
              onChange={setPriorityFilter}
              options={TASK_PRIORITY_OPTIONS}
              value={priorityFilter}
            />
          </div>
        </div>
      ) : null}
    </span>
  );
}

function isActiveClass(activeFilterCount: number) {
  return activeFilterCount > 0 ? " is-active" : "";
}

function readTaskMechanismIds(task: TaskRecord) {
  const mechanismIds = Array.isArray(task.mechanismIds) ? task.mechanismIds : [];
  const candidateIds = mechanismIds.length > 0 ? mechanismIds : [task.mechanismId];

  return Array.from(
    new Set(
      candidateIds.filter(
        (mechanismId): mechanismId is string =>
          typeof mechanismId === "string" && mechanismId.length > 0,
      ),
    ),
  );
}

function readTaskPartInstanceIds(task: TaskRecord) {
  const partInstanceIds = Array.isArray(task.partInstanceIds) ? task.partInstanceIds : [];
  const candidateIds = partInstanceIds.length > 0 ? partInstanceIds : [task.partInstanceId];

  return Array.from(
    new Set(
      candidateIds.filter(
        (partInstanceId): partInstanceId is string =>
          typeof partInstanceId === "string" && partInstanceId.length > 0,
      ),
    ),
  );
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
  const [subsystemIterationFilter, setSubsystemIterationFilter] =
    useState<FilterSelection>([]);
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
  const subsystemFilterOptions = useMemo(
    () =>
      bootstrap.subsystems.map((subsystem) => ({
        id: subsystem.id,
        name: `${subsystem.name} (${formatIterationVersion(subsystem.iteration)})`,
      })),
    [bootstrap.subsystems],
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

    const hasMechanicalTask = bootstrap.tasks.some((task) => {
      const disciplineCode = task.disciplineId
        ? disciplinesById[task.disciplineId]?.code
        : null;

      return (
        disciplineCode === "mechanical" &&
        readTaskSubsystemIds(task).includes(selectedSubsystemId)
      );
    });

    if (hasMechanicalTask) {
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
  const isTaskQueueMenuVisible = useWorkspaceCompactMode();
  const [isTaskQueueMenuOpen, setIsTaskQueueMenuOpen] = useState(false);

  useEffect(() => {
    if (!isTaskQueueMenuVisible) {
      setIsTaskQueueMenuOpen(false);
    }
  }, [isTaskQueueMenuVisible]);

  useEffect(() => {
    if (!showSubsystemIterationFilter && subsystemIterationFilter.length > 0) {
      setSubsystemIterationFilter([]);
    }
  }, [showSubsystemIterationFilter, subsystemIterationFilter]);

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
          readTaskSubsystemIds(task),
        ),
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
        return formatSubsystemNames(readTaskSubsystemIds(task), subsystemsById, "");
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
    subsystemIterationFilter,
    showSubsystemIterationFilter,
    subsystemsById,
  ]);
  const taskPagination = useWorkspacePagination(processedTasks);
  const taskFilterMotionClass = useFilterChangeMotionClass([
    activePersonFilter,
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
  const taskSortIsDefault = sortField === "dueDate" && sortOrder === "asc";

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
          <div data-tutorial-target="task-queue-search-input">
            <SearchToolbarInput
              ariaLabel="Search tasks"
              onChange={setSearchFilter}
              placeholder="Search tasks..."
              value={searchFilter}
            />
          </div>

          {isTaskQueueMenuVisible ? (
            <TaskQueueCompactFilterMenu
              activeFilterCount={[
                isAllProjectsView ? projectFilter : [],
                subsystemFilter,
                showSubsystemIterationFilter ? subsystemIterationFilter : [],
                ownerFilter,
                statusFilter,
                priorityFilter,
              ].filter((selection) => selection.length > 0).length}
              bootstrap={bootstrap}
              isAllProjectsView={isAllProjectsView}
              isOpen={isTaskQueueMenuOpen}
              onClose={() => setIsTaskQueueMenuOpen(false)}
              onToggle={() => setIsTaskQueueMenuOpen((current) => !current)}
              ownerFilter={ownerFilter}
              priorityFilter={priorityFilter}
              projectFilter={projectFilter}
              setPriorityFilter={setPriorityFilter}
              setProjectFilter={setProjectFilter}
              setStatusFilter={setStatusFilter}
              setSubsystemFilter={setSubsystemFilter}
              setSubsystemIterationFilter={setSubsystemIterationFilter}
              setOwnerFilter={setOwnerFilter}
              showSubsystemIterationFilter={showSubsystemIterationFilter}
              statusFilter={statusFilter}
              subsystemFilter={subsystemFilter}
              subsystemFilterOptions={subsystemFilterOptions}
              subsystemIterationFilter={subsystemIterationFilter}
              subsystemIterationOptions={subsystemIterationOptions}
            />
          ) : null}

          {isTaskQueueMenuVisible ? (
            <CompactFilterMenu
              activeCount={taskSortIsDefault ? 0 : 1}
              ariaLabel="Sort tasks"
              buttonLabel="Sort"
              className="task-queue-sort-menu"
              icon={<IconSort />}
              items={[
                {
                  label: "Sort by",
                  content: (
                    <select
                      aria-label="Sort tasks by"
                      className="task-queue-sort-menu-select"
                      onChange={(event) => setSortField(event.target.value as TaskSortField)}
                      value={sortField}
                    >
                      {TASK_SORT_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  ),
                },
                {
                  label: "Direction",
                  content: (
                    <select
                      aria-label="Sort direction"
                      className="task-queue-sort-menu-select"
                      onChange={(event) => setSortOrder(event.target.value as "asc" | "desc")}
                      value={sortOrder}
                    >
                      {SORT_DIRECTION_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  ),
                },
              ]}
            />
          ) : null}

          <button
            aria-label="Add task"
            className="primary-action queue-toolbar-action"
            data-tutorial-target="create-task-button"
            onClick={openCreateTaskModal}
            title="Add task"
            type="button"
          >
            Add
          </button>
        </div>
      </div>

      <div className={`table-shell ${taskFilterMotionClass}`}>
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
                options={subsystemFilterOptions}
                value={subsystemFilter}
              />
              {showSubsystemIterationFilter ? (
                <ColumnFilterDropdown
                  allLabel="All iterations"
                  ariaLabel="Filter tasks by subsystem iteration"
                  onChange={setSubsystemIterationFilter}
                  options={subsystemIterationOptions}
                  value={subsystemIterationFilter}
                />
              ) : null}
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
          const planningState = getTaskPlanningState(task, bootstrap);
          const linkedPartNames = readTaskPartInstanceIds(task)
            .map((partInstanceId) => {
              const partInstance = partInstancesById[partInstanceId];
              if (!partInstance) {
                return null;
              }

              const partDefinition = partDefinitionsById[partInstance.partDefinitionId];
              return partDefinition
                ? `${partInstance.name} (${partDefinition.name} (${formatIterationVersion(partDefinition.iteration)}))`
                : partInstance.name;
            })
            .filter((name): name is string => Boolean(name));

          return (
            <button
              className="queue-table queue-row editable-hover-target editable-hover-target-row"
              data-tutorial-target="edit-task-row"
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
                  {formatMechanismNames(
                    readTaskMechanismIds(task),
                    mechanismsById,
                    "No mechanism",
                  )}
                  {" / "}
                  {linkedPartNames.length > 0 ? linkedPartNames.join(", ") : "No part"}
                  {task.targetEventId
                    ? ` / target ${eventsById[task.targetEventId]?.title ?? "event"}`
                    : ""}
                </small>
                <small style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
                  <span className={getStatusPillClassName(planningState)}>
                    {formatTaskPlanningState(planningState)}
                  </span>
                </small>
              </span>
              {showSubsystemCol ? (
                <TableCell label="Subsystem">
                  {formatSubsystemNames(readTaskSubsystemIds(task), subsystemsById, "Unknown")}
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
