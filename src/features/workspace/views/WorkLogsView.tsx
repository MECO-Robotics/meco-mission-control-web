import { useMemo, useState, type CSSProperties } from "react";

import { formatDate } from "@/lib/appUtils";
import type { BootstrapPayload, TaskRecord } from "@/types";
import { IconSubsystems, IconWorkLogs } from "@/components/shared";
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
  formatFilterSelectionLabel,
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
}

function buildTaskById(tasks: BootstrapPayload["tasks"]) {
  return Object.fromEntries(tasks.map((task) => [task.id, task])) as Record<string, TaskRecord>;
}

export function WorkLogsView({
  activePersonFilter,
  bootstrap,
  membersById,
  openCreateWorkLogModal,
  openEditTaskModal,
  subsystemsById,
}: WorkLogsViewProps) {
  const [search, setSearch] = useState("");
  const [subsystemFilter, setSubsystemFilter] = useState<FilterSelection>([]);
  const [sortMode, setSortMode] = useState<WorkLogSortMode>("recent");

  const taskById = useMemo(() => buildTaskById(bootstrap.tasks), [bootstrap.tasks]);

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

  const activePersonFilterLabel =
    formatFilterSelectionLabel("All roster", bootstrap.members, activePersonFilter);

  const gridTemplate = "minmax(220px, 2.05fr) minmax(190px, 1.35fr) minmax(180px, 1fr) 0.45fr";

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

          <FilterDropdown
            allLabel="All subsystems"
            ariaLabel="Filter work logs by subsystem"
            className="mobile-filter-control"
            icon={<IconSubsystems />}
            onChange={setSubsystemFilter}
            options={bootstrap.subsystems}
            value={subsystemFilter}
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
            onClick={openCreateWorkLogModal}
            title="Add work log"
            type="button"
          >
            Add
          </button>
        </div>
      </div>

      <div className="table-shell">
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




