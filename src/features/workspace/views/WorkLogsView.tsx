import { useMemo, useState, type CSSProperties } from "react";

import { formatDate } from "@/lib/appUtils";
import type { WorklogsViewTab } from "@/lib/workspaceNavigation";
import type { BootstrapPayload, TaskRecord } from "@/types";
import { IconSubsystems, IconWorkLogs } from "@/components/shared";
import {
  ColumnFilterDropdown,
  CompactFilterMenu,
  EditableHoverIndicator,
  type FilterSelection,
  FilterDropdown,
  PaginationControls,
  SearchToolbarInput,
  TableCell,
  filterSelectionIncludes,
  filterSelectionIntersects,
  formatFilterSelectionLabel,
  useFilterChangeMotionClass,
  useWorkspacePagination,
} from "@/features/workspace/shared";
import type { DropdownOption, MembersById, SubsystemsById } from "@/features/workspace/shared";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared";

type WorkLogSortMode = "recent" | "oldest" | "longest" | "shortest";

const WORKLOG_SORT_OPTIONS: DropdownOption[] = [
  { id: "recent", name: "Newest first" },
  { id: "oldest", name: "Oldest first" },
  { id: "longest", name: "Longest first" },
  { id: "shortest", name: "Shortest first" },
];

interface WorkLogsViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  membersById: MembersById;
  openCreateWorkLogModal: () => void;
  openEditTaskModal: (task: TaskRecord) => void;
  subsystemsById: SubsystemsById;
  view: WorklogsViewTab;
}

function buildTaskById(tasks: BootstrapPayload["tasks"]) {
  return Object.fromEntries(tasks.map((task) => [task.id, task])) as Record<string, TaskRecord>;
}

function formatHours(hours: number) {
  return `${hours.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}h`;
}

function TimeMetricGraphic({
  colorClassName,
  hours,
  label,
  maxHours,
}: {
  colorClassName: string;
  hours: number;
  label: string;
  maxHours: number;
}) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const normalizedRatio = maxHours > 0 ? Math.max(0, Math.min(1, hours / maxHours)) : 0;
  const strokeDashoffset = circumference * (1 - normalizedRatio);

  return (
    <article className="risk-time-card">
      <h3>{label}</h3>
      <div className="risk-time-card-graphic" role="img" aria-label={`${label}: ${formatHours(hours)}`}>
        <svg viewBox="0 0 140 140">
          <circle className="risk-time-ring-track" cx="70" cy="70" r={radius} />
          <circle
            className={`risk-time-ring-fill ${colorClassName}`}
            cx="70"
            cy="70"
            r={radius}
            style={{
              strokeDasharray: `${circumference} ${circumference}`,
              strokeDashoffset,
            }}
          />
        </svg>
        <div className="risk-time-card-value">
          <strong>{formatHours(hours)}</strong>
        </div>
      </div>
    </article>
  );
}

export function WorkLogsView({
  activePersonFilter,
  bootstrap,
  membersById,
  openCreateWorkLogModal,
  openEditTaskModal,
  subsystemsById,
  view,
}: WorkLogsViewProps) {
  const [search, setSearch] = useState("");
  const [subsystemFilter, setSubsystemFilter] = useState<FilterSelection>([]);
  const [sortMode, setSortMode] = useState<WorkLogSortMode>("recent");

  const taskById = useMemo(() => buildTaskById(bootstrap.tasks), [bootstrap.tasks]);
  const summaryWorkLogs = useMemo(() => {
    if (activePersonFilter.length === 0) {
      return bootstrap.workLogs;
    }

    return bootstrap.workLogs.filter((workLog) =>
      workLog.participantIds.some((participantId) =>
        filterSelectionIncludes(activePersonFilter, participantId),
      ),
    );
  }, [activePersonFilter, bootstrap.workLogs]);

  const summaryTaskIds = useMemo(() => {
    return new Set(summaryWorkLogs.map((workLog) => workLog.taskId));
  }, [summaryWorkLogs]);

  const plannedHours = useMemo(() => {
    const taskPool =
      activePersonFilter.length === 0
        ? bootstrap.tasks
        : bootstrap.tasks.filter((task) => summaryTaskIds.has(task.id));

    return taskPool.reduce(
      (total, task) => total + Math.max(0, Number(task.estimatedHours) || 0),
      0,
    );
  }, [activePersonFilter.length, bootstrap.tasks, summaryTaskIds]);
  const loggedHours = useMemo(
    () =>
      summaryWorkLogs.reduce(
        (total, workLog) => total + Math.max(0, Number(workLog.hours) || 0),
        0,
      ),
    [summaryWorkLogs],
  );
  const totalLogs = summaryWorkLogs.length;
  const tasksWithLogsCount = summaryTaskIds.size;
  const activeContributorCount = useMemo(() => {
    const contributorIds = new Set<string>();
    summaryWorkLogs.forEach((workLog) => {
      workLog.participantIds.forEach((participantId) => contributorIds.add(participantId));
    });
    return contributorIds.size;
  }, [summaryWorkLogs]);
  const averageHoursPerLog = totalLogs > 0 ? loggedHours / totalLogs : 0;
  const maxMetricHours = Math.max(plannedHours, loggedHours, 1);
  const completionRatio = plannedHours > 0 ? loggedHours / plannedHours : 0;
  const completionPercent = Math.round(completionRatio * 100);
  const clampedCompletionWidth = `${Math.max(0, Math.min(100, completionRatio * 100))}%`;
  const isOverPlan = loggedHours > plannedHours;
  const overrunHours = Math.max(0, loggedHours - plannedHours);
  const remainingHours = Math.max(0, plannedHours - loggedHours);

  const topContributors = useMemo(() => {
    const contributorHours = new Map<string, number>();

    summaryWorkLogs.forEach((workLog) => {
      if (workLog.participantIds.length === 0) {
        contributorHours.set(
          "__unassigned__",
          (contributorHours.get("__unassigned__") ?? 0) + workLog.hours,
        );
        return;
      }

      const sharedHours = workLog.hours / workLog.participantIds.length;
      workLog.participantIds.forEach((participantId) => {
        contributorHours.set(
          participantId,
          (contributorHours.get(participantId) ?? 0) + sharedHours,
        );
      });
    });

    return Array.from(contributorHours.entries())
      .map(([participantId, hours]) => ({
        id: participantId,
        name:
          participantId === "__unassigned__"
            ? "Unassigned"
            : membersById[participantId]?.name ?? "Unknown member",
        hours,
      }))
      .sort((left, right) => right.hours - left.hours)
      .slice(0, 5);
  }, [summaryWorkLogs, membersById]);

  const topTasks = useMemo(() => {
    const taskHours = new Map<string, number>();

    summaryWorkLogs.forEach((workLog) => {
      taskHours.set(workLog.taskId, (taskHours.get(workLog.taskId) ?? 0) + workLog.hours);
    });

    return Array.from(taskHours.entries())
      .map(([taskId, hours]) => {
        const task = taskById[taskId];
        const subsystemName = task
          ? task.subsystemIds
              .map((subsystemId) => subsystemsById[subsystemId]?.name ?? "")
              .filter(Boolean)
              .join(", ") || "Unknown subsystem"
          : "Unknown subsystem";

        return {
          id: taskId,
          hours,
          subsystemName,
          title: task?.title ?? "Missing task",
        };
      })
      .sort((left, right) => right.hours - left.hours)
      .slice(0, 5);
  }, [summaryWorkLogs, subsystemsById, taskById]);

  const workLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = bootstrap.workLogs.filter((workLog) => {
      if (
        activePersonFilter.length > 0 &&
        !workLog.participantIds.some((participantId) =>
          filterSelectionIncludes(activePersonFilter, participantId),
        )
      ) {
        return false;
      }

      const task = taskById[workLog.taskId];
      if (
        subsystemFilter.length > 0 &&
        !filterSelectionIntersects(
          subsystemFilter,
          task ? Array.from(new Set([task.subsystemId, ...task.subsystemIds].filter(Boolean))) : [],
        )
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      const participantNames = workLog.participantIds
        .map((participantId) => membersById[participantId]?.name ?? "")
        .join(" ")
        .toLowerCase();
      const taskText = `${task?.title ?? ""} ${task?.summary ?? ""}`.toLowerCase();
      const subsystemText = task
        ? task.subsystemIds
            .map((subsystemId) => subsystemsById[subsystemId]?.name ?? "")
            .join(" ")
        : "";

      return (
        workLog.notes.toLowerCase().includes(query) ||
        taskText.includes(query) ||
        subsystemText.toLowerCase().includes(query) ||
        participantNames.includes(query)
      );
    });

    const compareDate = (left: string, right: string) => left.localeCompare(right);

    return filtered.sort((left, right) => {
      if (sortMode === "longest") {
        return right.hours - left.hours || compareDate(right.date, left.date);
      }

      if (sortMode === "shortest") {
        return left.hours - right.hours || compareDate(right.date, left.date);
      }

      if (sortMode === "oldest") {
        return compareDate(left.date, right.date) || compareDate(left.taskId, right.taskId);
      }

      return compareDate(right.date, left.date) || compareDate(left.taskId, right.taskId);
    });
  }, [
    activePersonFilter,
    bootstrap.workLogs,
    membersById,
    sortMode,
    subsystemsById,
    subsystemFilter,
    taskById,
    search,
  ]);
  const workLogPagination = useWorkspacePagination(workLogs);
  const workLogFilterMotionClass = useFilterChangeMotionClass([
    activePersonFilter,
    search,
    sortMode,
    subsystemFilter,
  ]);

  const activePersonFilterLabel =
    formatFilterSelectionLabel("All roster", bootstrap.members, activePersonFilter);

  const gridTemplate = "minmax(220px, 2.05fr) minmax(190px, 1.35fr) minmax(180px, 1fr) 0.45fr";

  if (view === "summary") {
    return (
      <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
        <div className="panel-header compact-header">
          <div className="queue-section-header">
            <h2>Work log summary</h2>
            <p className="section-copy filter-copy">
              Snapshot of logged execution against planned effort.
            </p>
          </div>
        </div>

        <div className="risk-time-metrics-shell">
          <TimeMetricGraphic
            colorClassName="risk-time-ring-planned"
            hours={plannedHours}
            label="Time planned"
            maxHours={maxMetricHours}
          />
          <TimeMetricGraphic
            colorClassName="risk-time-ring-done"
            hours={loggedHours}
            label="Work done"
            maxHours={maxMetricHours}
          />
        </div>

        <div className="risk-time-progress-shell">
          <p className="risk-time-progress-label">
            {plannedHours > 0
              ? `${completionPercent}% of planned hours logged`
              : "No planned hours for current log scope yet"}
          </p>
          <div className="risk-time-progress-track" aria-hidden="true">
            <span style={{ width: clampedCompletionWidth }} />
          </div>
          <p className="risk-time-progress-caption">
            {isOverPlan
              ? `${formatHours(overrunHours)} over plan`
              : `${formatHours(remainingHours)} remaining to plan`}
          </p>
        </div>

        <div className="summary-row worklog-summary-stat-grid">
          <article className="worklog-summary-stat-card">
            <h3>Logs captured</h3>
            <strong>{totalLogs}</strong>
          </article>
          <article className="worklog-summary-stat-card">
            <h3>Avg hours / log</h3>
            <strong>{formatHours(averageHoursPerLog)}</strong>
          </article>
          <article className="worklog-summary-stat-card">
            <h3>Active contributors</h3>
            <strong>{activeContributorCount}</strong>
          </article>
          <article className="worklog-summary-stat-card">
            <h3>Tasks represented</h3>
            <strong>{tasksWithLogsCount}</strong>
          </article>
        </div>

        <div className="summary-row">
          <article className="worklog-summary-card">
            <h3>Top contributors</h3>
            {topContributors.length === 0 ? (
              <p className="section-copy">No logged work yet.</p>
            ) : (
              <ol className="worklog-summary-list">
                {topContributors.map((entry) => (
                  <li className="worklog-summary-list-item" key={entry.id}>
                    <span className="worklog-summary-list-label">{entry.name}</span>
                    <strong>{formatHours(entry.hours)}</strong>
                  </li>
                ))}
              </ol>
            )}
          </article>

          <article className="worklog-summary-card">
            <h3>Most logged tasks</h3>
            {topTasks.length === 0 ? (
              <p className="section-copy">No task-linked logs yet.</p>
            ) : (
              <ol className="worklog-summary-list">
                {topTasks.map((entry) => {
                  const task = taskById[entry.id];

                  return (
                    <li className="worklog-summary-list-item" key={entry.id}>
                      <div className="worklog-summary-task-meta">
                        {task ? (
                          <button
                            className="worklog-summary-task-link"
                            onClick={() => openEditTaskModal(task)}
                            type="button"
                          >
                            {entry.title}
                          </button>
                        ) : (
                          <span className="worklog-summary-list-label">{entry.title}</span>
                        )}
                        <small>{entry.subsystemName}</small>
                      </div>
                      <strong>{formatHours(entry.hours)}</strong>
                    </li>
                  );
                })}
              </ol>
            )}
          </article>
        </div>
      </section>
    );
  }

  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Work logs</h2>
          <p className="section-copy filter-copy">
            {activePersonFilter.length === 0
              ? "All logged work tied back to tasks."
              : `Only logs involving ${activePersonFilterLabel}.`}
          </p>
        </div>
        <div className="panel-actions filter-toolbar queue-toolbar worklog-toolbar">
          <SearchToolbarInput
            ariaLabel="Search work logs"
            onChange={setSearch}
            placeholder="Search work logs..."
            value={search}
          />

          <CompactFilterMenu
            activeCount={subsystemFilter.length}
            ariaLabel="Work log filters"
            buttonLabel="Filters"
            className="materials-filter-menu"
            items={[
              {
                label: "Subsystem",
                content: (
                  <FilterDropdown
                    allLabel="All subsystems"
                    ariaLabel="Filter work logs by subsystem"
                    className="task-queue-filter-menu-submenu"
                    icon={<IconSubsystems />}
                    onChange={setSubsystemFilter}
                    options={bootstrap.subsystems}
                    value={subsystemFilter}
                  />
                ),
              },
            ]}
          />

          <label
            className={`toolbar-filter toolbar-filter-compact${sortMode !== "recent" ? " is-active" : ""}`}
            aria-label="Sort work logs"
          >
            <span className="toolbar-filter-icon">
              <IconWorkLogs />
            </span>
            <select
              aria-label="Sort work logs"
              onChange={(event) => setSortMode(event.target.value as WorkLogSortMode)}
              value={sortMode}
            >
              {WORKLOG_SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
          <button
            aria-label="Add work log"
            className="primary-action queue-toolbar-action"
            data-tutorial-target="create-worklog-button"
            onClick={openCreateWorkLogModal}
            title="Add work log"
            type="button"
          >
            Add
          </button>
        </div>
      </div>

      <div className={`table-shell ${workLogFilterMotionClass}`}>
        <div
          className="ops-table ops-table-header worklog-table"
          style={{ "--workspace-grid-template": gridTemplate } as CSSProperties}
        >
          <span>Log</span>
          <span className="table-column-header-cell">
            <span className="table-column-title">Task</span>
            <ColumnFilterDropdown
              allLabel="All subsystems"
              ariaLabel="Filter work logs by subsystem"
              onChange={setSubsystemFilter}
              options={bootstrap.subsystems}
              value={subsystemFilter}
            />
          </span>
          <span>People</span>
          <span>Open</span>
        </div>

        {workLogPagination.pageItems.map((workLog) => {
          const task = taskById[workLog.taskId];
          const subsystemName = task
            ? task.subsystemIds
                .map((subsystemId) => subsystemsById[subsystemId]?.name ?? "")
                .filter(Boolean)
                .join(", ") || "Unknown subsystem"
            : "Unknown task";
          const participantNames = workLog.participantIds
            .map((participantId) => membersById[participantId]?.name)
            .filter((name): name is string => Boolean(name));

          return (
            <button
              className="ops-table ops-row worklog-row ops-button-row editable-hover-target editable-hover-target-row"
              key={workLog.id}
              onClick={() => {
                if (task) {
                  openEditTaskModal(task);
                }
              }}
              style={{ "--workspace-grid-template": gridTemplate } as CSSProperties}
              title={task ? `Open ${task.title}` : "Linked task not found"}
              type="button"
            >
              <TableCell label="Log">
                <div className="requested-item-meta">
                  <strong className="requested-item-title">{formatDate(workLog.date)}</strong>
                  <small className="requested-item-subtitle">{workLog.hours.toFixed(1)}h logged</small>
                  <small>{workLog.notes || "No notes recorded"}</small>
                </div>
              </TableCell>
              <TableCell label="Task">
                <div className="requested-item-meta">
                  <strong className="requested-item-title">{task?.title ?? "Missing task"}</strong>
                  <small className="requested-item-subtitle">{subsystemName}</small>
                </div>
              </TableCell>
              <TableCell label="People">
                {participantNames.length > 0 ? participantNames.join(", ") : "Unassigned"}
              </TableCell>
              <TableCell label="Open">
                {task ? <EditableHoverIndicator /> : null}
              </TableCell>
            </button>
          );
        })}

        {workLogs.length === 0 ? <p className="empty-state">No work logs match the current filters.</p> : null}
        <PaginationControls
          label="work logs"
          onPageChange={workLogPagination.setPage}
          onPageSizeChange={workLogPagination.setPageSize}
          page={workLogPagination.page}
          pageSize={workLogPagination.pageSize}
          pageSizeOptions={workLogPagination.pageSizeOptions}
          rangeEnd={workLogPagination.rangeEnd}
          rangeStart={workLogPagination.rangeStart}
          totalItems={workLogPagination.totalItems}
          totalPages={workLogPagination.totalPages}
        />
      </div>
    </section>
  );
}
