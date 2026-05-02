import type { Dispatch, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types";
import { IconSort } from "@/components/shared";
import { SearchToolbarInput } from "@/features/workspace/shared/WorkspaceViewShared";
import { CompactFilterMenu } from "@/features/workspace/shared/filters";
import type { FilterSelection } from "@/features/workspace/shared/filters";
import type { DropdownOption } from "@/features/workspace/shared/model";

import { TaskQueueCompactFilterMenu } from "./TaskQueueCompactFilterMenu";
import { SORT_DIRECTION_OPTIONS, TASK_SORT_OPTIONS, type TaskSortField } from "./taskQueueViewState";

interface TaskQueueToolbarProps {
  activeFilterCount: number;
  activePersonFilterLabel: string;
  bootstrap: BootstrapPayload;
  disciplineFilter: FilterSelection;
  disciplineOptions: DropdownOption[];
  isAllProjectsView: boolean;
  openCreateTaskModal: () => void;
  ownerFilter: FilterSelection;
  priorityFilter: FilterSelection;
  projectFilter: FilterSelection;
  searchFilter: string;
  setDisciplineFilter: Dispatch<SetStateAction<FilterSelection>>;
  setOwnerFilter: Dispatch<SetStateAction<FilterSelection>>;
  setPriorityFilter: Dispatch<SetStateAction<FilterSelection>>;
  setProjectFilter: Dispatch<SetStateAction<FilterSelection>>;
  setSearchFilter: Dispatch<SetStateAction<string>>;
  setSortField: Dispatch<SetStateAction<TaskSortField>>;
  setSortOrder: Dispatch<SetStateAction<"asc" | "desc">>;
  setStatusFilter: Dispatch<SetStateAction<FilterSelection>>;
  setSubsystemFilter: Dispatch<SetStateAction<FilterSelection>>;
  setSubsystemIterationFilter: Dispatch<SetStateAction<FilterSelection>>;
  showSubsystemIterationFilter: boolean;
  sortField: TaskSortField;
  sortOrder: "asc" | "desc";
  statusFilter: FilterSelection;
  subsystemFilter: FilterSelection;
  subsystemFilterOptions: DropdownOption[];
  subsystemIterationFilter: FilterSelection;
  subsystemIterationOptions: DropdownOption[];
  taskSortIsDefault: boolean;
}

export function TaskQueueToolbar({
  activeFilterCount,
  activePersonFilterLabel,
  bootstrap,
  disciplineFilter,
  disciplineOptions,
  isAllProjectsView,
  openCreateTaskModal,
  ownerFilter,
  priorityFilter,
  projectFilter,
  searchFilter,
  setDisciplineFilter,
  setOwnerFilter,
  setPriorityFilter,
  setProjectFilter,
  setSearchFilter,
  setSortField,
  setSortOrder,
  setStatusFilter,
  setSubsystemFilter,
  setSubsystemIterationFilter,
  showSubsystemIterationFilter,
  sortField,
  sortOrder,
  statusFilter,
  subsystemFilter,
  subsystemFilterOptions,
  subsystemIterationFilter,
  subsystemIterationOptions,
  taskSortIsDefault,
}: TaskQueueToolbarProps) {
  return (
    <div className="panel-header compact-header">
      <div className="queue-section-header">
        <h2>Task kanban</h2>
        <p className="section-copy filter-copy">
          {activePersonFilterLabel === "All roster"
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
          activeFilterCount={activeFilterCount}
          bootstrap={bootstrap}
          disciplineFilter={disciplineFilter}
          disciplineOptions={disciplineOptions}
          isAllProjectsView={isAllProjectsView}
          ownerFilter={ownerFilter}
          priorityFilter={priorityFilter}
          projectFilter={projectFilter}
          setDisciplineFilter={setDisciplineFilter}
          setOwnerFilter={setOwnerFilter}
          setPriorityFilter={setPriorityFilter}
          setProjectFilter={setProjectFilter}
          setStatusFilter={setStatusFilter}
          setSubsystemFilter={setSubsystemFilter}
          setSubsystemIterationFilter={setSubsystemIterationFilter}
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
  );
}
