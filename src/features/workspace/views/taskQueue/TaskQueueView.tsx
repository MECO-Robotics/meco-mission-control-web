import { useEffect, useMemo, useRef, useState, useId } from "react";

import { formatIterationVersion } from "@/lib/appUtils";
import type { BootstrapPayload, TaskRecord } from "@/types";
import {
  IconChevronLeft,
  IconChevronRight,
  IconManufacturing,
  IconFilter,
  IconParts,
  IconPerson,
  IconSort,
  IconTasks,
} from "@/components/shared";
import {
  CompactFilterMenu,
  type DropdownOption,
  type FilterSelection,
  FilterDropdown,
  SearchToolbarInput,
  filterSelectionIncludes,
  filterSelectionIntersects,
  filterSelectionMatchesTaskPeople,
  formatFilterSelectionLabel,
  useFilterChangeMotionClass,
} from "@/features/workspace/shared";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared";
import { TASK_PRIORITY_OPTIONS } from "@/features/workspace/shared";
import {
  TASK_QUEUE_LAZY_LOAD_BATCH_SIZE,
  type TaskQueueBoardState,
  getTaskQueueBoardState,
  getTaskQueueBoardStateSortValue,
  formatSubsystemNames,
  formatTaskQueueAssignees,
  readTaskAssigneeIds,
  readTaskSubsystemIds,
  TASK_QUEUE_STATUS_OPTIONS,
} from "@/features/workspace/views/taskQueue/taskQueueKanban";
import { TaskQueueKanbanBoard } from "@/features/workspace/views/taskQueue/TaskQueueKanbanBoard";

type TaskSortField =
  | "disciplineId"
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
  { id: "disciplineId", name: "Discipline" },
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

function getStableToneClassName(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return FILTER_TONE_CLASSES[hash % FILTER_TONE_CLASSES.length];
}

function getTaskQueueStatusToneClassName(value: string) {
  switch (value) {
    case "in-progress":
      return "filter-tone-warning";
    case "waiting-for-qa":
      return "filter-tone-info";
    case "complete":
      return "filter-tone-success";
    case "blocked":
      return "filter-tone-danger";
    case "not-started":
      return "filter-tone-neutral";
    default:
      return "filter-tone-neutral";
  }
}

interface TaskQueueViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  isAllProjectsView: boolean;
  isNonRobotProject: boolean;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  openCreateTaskModal: () => void;
  openEditTaskModal: (task: TaskRecord) => void;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
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
  setDisciplineFilter,
  setSubsystemFilter,
  setSubsystemIterationFilter,
  setOwnerFilter,
  disciplineFilter,
  disciplineOptions,
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
  disciplineFilter: FilterSelection;
  disciplineOptions: DropdownOption[];
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
  setDisciplineFilter: (value: FilterSelection) => void;
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
            <span className="task-queue-filter-menu-label">Discipline</span>
              <FilterDropdown
                allLabel="All disciplines"
                ariaLabel="Filter tasks by discipline"
                className="task-queue-filter-menu-submenu"
                icon={<IconTasks />}
                getOptionToneClassName={(option) => getStableToneClassName(option.id)}
                getSelectedToneClassName={(selection) =>
                  selection.length === 1 ? getStableToneClassName(selection[0]) : undefined
                }
                onChange={setDisciplineFilter}
                options={disciplineOptions}
                value={disciplineFilter}
              />
          </div>

          <div className="task-queue-filter-menu-item">
            <span className="task-queue-filter-menu-label">Subsystem</span>
              <FilterDropdown
                allLabel="All subsystems"
                ariaLabel="Filter tasks by subsystem"
                className="task-queue-filter-menu-submenu"
                icon={<IconManufacturing />}
                getOptionToneClassName={(option) => getStableToneClassName(option.id)}
                getSelectedToneClassName={(selection) =>
                  selection.length === 1 ? getStableToneClassName(selection[0]) : undefined
                }
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
                getOptionToneClassName={(option) => getTaskQueueStatusToneClassName(option.id)}
                getSelectedToneClassName={(selection) =>
                  selection.length === 1 ? getTaskQueueStatusToneClassName(selection[0]) : undefined
                }
                onChange={setStatusFilter}
                options={TASK_QUEUE_STATUS_OPTIONS}
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

export function TaskQueueView({
  activePersonFilter,
  bootstrap,
  disciplinesById,
  isAllProjectsView,
  isNonRobotProject,
  membersById,
  openCreateTaskModal,
  openEditTaskModal,
  subsystemsById,
}: TaskQueueViewProps) {
  const [sortField, setSortField] = useState<TaskSortField>("dueDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [projectFilter, setProjectFilter] = useState<FilterSelection>([]);
  const [statusFilter, setStatusFilter] = useState<FilterSelection>([]);
  const [disciplineFilter, setDisciplineFilter] = useState<FilterSelection>([]);
  const [subsystemFilter, setSubsystemFilter] = useState<FilterSelection>([]);
  const [subsystemIterationFilter, setSubsystemIterationFilter] =
    useState<FilterSelection>([]);
  const [ownerFilter, setOwnerFilter] = useState<FilterSelection>([]);
  const [priorityFilter, setPriorityFilter] = useState<FilterSelection>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [focusedBoardState, setFocusedBoardState] = useState<TaskQueueBoardState | null>(null);

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
  const [isTaskQueueMenuOpen, setIsTaskQueueMenuOpen] = useState(false);

  useEffect(() => {
    if (!showSubsystemIterationFilter && subsystemIterationFilter.length > 0) {
      setSubsystemIterationFilter([]);
    }
  }, [showSubsystemIterationFilter, subsystemIterationFilter]);
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

    const readSortValue = (task: TaskRecord): number | string => {
      if (sortField === "priority") {
        return priorityValues[task.priority] ?? 0;
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
    bootstrap,
    subsystemsById,
  ]);
  const [visibleTaskCount, setVisibleTaskCount] = useState(TASK_QUEUE_LAZY_LOAD_BATCH_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const taskQueueBoardShellRef = useRef<HTMLDivElement>(null);
  const [taskQueueBoardScrollState, setTaskQueueBoardScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
    hasOverflow: false,
  });
  const isFocused = focusedBoardState !== null;

  useEffect(() => {
    if (focusedBoardState === null) {
      return;
    }

    const hasMatchingTasks = processedTasks.some(
      (task) => getTaskQueueBoardState(task, bootstrap) === focusedBoardState,
    );
    if (!hasMatchingTasks) {
      setFocusedBoardState(null);
    }
  }, [bootstrap, focusedBoardState, processedTasks]);

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

  useEffect(() => {
    setVisibleTaskCount(TASK_QUEUE_LAZY_LOAD_BATCH_SIZE);
  }, [processedTasks]);

  useEffect(() => {
    const shell = taskQueueBoardShellRef.current;
    if (!shell) {
      setTaskQueueBoardScrollState({
        canScrollLeft: false,
        canScrollRight: false,
        hasOverflow: false,
      });
      return;
    }

    const updateScrollState = () => {
      const maxScrollLeft = Math.max(0, shell.scrollWidth - shell.clientWidth);
      const nextHasOverflow = shell.scrollWidth > shell.clientWidth + 4;
      const nextCanScrollLeft = nextHasOverflow && shell.scrollLeft > 4;
      const nextCanScrollRight = nextHasOverflow && shell.scrollLeft < maxScrollLeft - 4;

      setTaskQueueBoardScrollState((current) =>
        current.hasOverflow === nextHasOverflow &&
        current.canScrollLeft === nextCanScrollLeft &&
        current.canScrollRight === nextCanScrollRight
          ? current
          : {
              canScrollLeft: nextCanScrollLeft,
              canScrollRight: nextCanScrollRight,
              hasOverflow: nextHasOverflow,
            },
      );
    };

    let rafId: number | undefined;
    const scheduleScrollStateUpdate = () => {
      if (rafId !== undefined) {
        return;
      }

      rafId = window.requestAnimationFrame(() => {
        rafId = undefined;
        updateScrollState();
      });
    };

    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleScrollStateUpdate);

    resizeObserver?.observe(shell);
    shell.addEventListener("scroll", scheduleScrollStateUpdate, { passive: true });
    window.addEventListener("resize", scheduleScrollStateUpdate);
    updateScrollState();

    return () => {
      if (rafId !== undefined) {
        window.cancelAnimationFrame(rafId);
      }

      resizeObserver?.disconnect();
      shell.removeEventListener("scroll", scheduleScrollStateUpdate);
      window.removeEventListener("resize", scheduleScrollStateUpdate);
    };
  }, [processedTasks.length, visibleTaskCount]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      isFocused ||
      visibleTaskCount >= processedTasks.length
    ) {
      return;
    }

    const loadMore = () => {
      setVisibleTaskCount((current) =>
        Math.min(current + TASK_QUEUE_LAZY_LOAD_BATCH_SIZE, processedTasks.length),
      );
    };

    const maybeLoadMore = () => {
      const sentinel = loadMoreRef.current;
      if (!sentinel) {
        return;
      }

      const sentinelRect = sentinel.getBoundingClientRect();
      if (sentinelRect.top <= window.innerHeight + 240) {
        loadMore();
      }
    };

    let rafId: number | undefined;
    const handleScroll = () => {
      if (rafId !== undefined) {
        return;
      }

      rafId = window.requestAnimationFrame(() => {
        rafId = undefined;
        maybeLoadMore();
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    maybeLoadMore();

    return () => {
      if (rafId !== undefined) {
        window.cancelAnimationFrame(rafId);
      }

      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isFocused, processedTasks.length, visibleTaskCount]);
  const visibleTasks = useMemo(
    () => processedTasks.slice(0, visibleTaskCount),
    [processedTasks, visibleTaskCount],
  );
  const boardTasks = useMemo(
    () => (focusedBoardState === null ? visibleTasks : processedTasks),
    [focusedBoardState, processedTasks, visibleTasks],
  );
  const hasMoreTasks = !isFocused && visibleTaskCount < processedTasks.length;
  const loadedTaskLabel = `${Math.min(visibleTaskCount, processedTasks.length)} of ${processedTasks.length}`;
  const showProjectOnCards = isAllProjectsView && projectFilter.length === 0;
  const showProjectContextOnCards = !isAllProjectsView;
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
  const taskSortIsDefault = sortField === "dueDate" && sortOrder === "asc";

  return (
    <section className={`panel dense-panel task-queue-view ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Task kanban</h2>
          <p className="section-copy filter-copy">
            {activePersonFilter.length === 0
              ? "All tasks in kanban."
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

          <TaskQueueCompactFilterMenu
            activeFilterCount={[
              isAllProjectsView ? projectFilter : [],
              disciplineFilter,
              subsystemFilter,
              showSubsystemIterationFilter ? subsystemIterationFilter : [],
              ownerFilter,
              statusFilter,
              priorityFilter,
            ].filter((selection) => selection.length > 0).length}
            bootstrap={bootstrap}
            disciplineFilter={disciplineFilter}
            disciplineOptions={disciplineOptions}
            isAllProjectsView={isAllProjectsView}
            isOpen={isTaskQueueMenuOpen}
            onClose={() => setIsTaskQueueMenuOpen(false)}
            onToggle={() => setIsTaskQueueMenuOpen((current) => !current)}
            ownerFilter={ownerFilter}
            priorityFilter={priorityFilter}
            projectFilter={projectFilter}
            setDisciplineFilter={setDisciplineFilter}
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

      <div
        className={`task-queue-board-shell-frame${taskQueueBoardScrollState.canScrollLeft ? " has-scroll-left" : ""}${taskQueueBoardScrollState.canScrollRight ? " has-scroll-right" : ""}${taskQueueBoardScrollState.hasOverflow ? " has-task-queue-board-overflow" : ""}${isFocused ? " is-focused-column" : ""} ${taskFilterMotionClass}`}
      >
        {taskQueueBoardScrollState.hasOverflow ? (
          <div aria-hidden="true" className="task-queue-board-scroll-hints">
            <div
              className={`task-queue-board-scroll-hint task-queue-board-scroll-hint-left${
                taskQueueBoardScrollState.canScrollLeft ? "" : " is-hidden"
              }`}
            >
              <IconChevronLeft />
              <span className="task-queue-board-scroll-hint-label">Scroll</span>
            </div>
            <div
              className={`task-queue-board-scroll-hint task-queue-board-scroll-hint-right${
                taskQueueBoardScrollState.canScrollRight ? "" : " is-hidden"
              }`}
            >
              <span className="task-queue-board-scroll-hint-label">Scroll</span>
              <IconChevronRight />
            </div>
          </div>
        ) : null}
        <div className={`table-shell task-queue-board-shell${isFocused ? " is-focused-column" : ""}`} ref={taskQueueBoardShellRef}>
          {boardTasks.length > 0 ? (
            <TaskQueueKanbanBoard
              bootstrap={bootstrap}
              disciplinesById={disciplinesById}
              isNonRobotProject={isNonRobotProject}
              focusedState={focusedBoardState}
              membersById={membersById}
              openEditTaskModal={openEditTaskModal}
              projectsById={projectsById}
              showProjectContextOnCards={showProjectContextOnCards}
              showProjectOnCards={showProjectOnCards}
              onClearFocus={() => setFocusedBoardState(null)}
              onFocusState={setFocusedBoardState}
              subsystemsById={subsystemsById}
              tasks={boardTasks}
              workstreamsById={workstreamsById}
            />
          ) : (
            <p className="empty-state">No tasks match the current filters.</p>
          )}
          {!isFocused ? (
            <div className="task-queue-board-footer">
              <p className="task-queue-board-load-status">
                Showing {loadedTaskLabel} tasks
                {hasMoreTasks ? " - scroll to load more." : "."}
              </p>
              {hasMoreTasks ? (
                <div
                  aria-hidden="true"
                  className="task-queue-board-load-sentinel"
                  ref={loadMoreRef}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
