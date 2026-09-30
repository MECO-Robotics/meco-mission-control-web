import type { Dispatch, SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import { IconSort } from "@/components/shared/Icons";
import { WorkspaceTopbarZoom } from "@/features/workspace/shared/topbar";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";
import { SortDirectionToggle } from "@/features/workspace/shared/filters/SortDirectionToggle";

import { TaskQueueCompactFilterMenu } from "./TaskQueueCompactFilterMenu";
import {
  clampTaskQueueZoom,
  formatTaskQueueZoomLabel,
  TASK_QUEUE_ZOOM_MAX,
  TASK_QUEUE_ZOOM_MIN,
  TASK_QUEUE_ZOOM_STEP,
  TASK_SORT_OPTIONS,
  type TaskSortField,
} from "./taskQueueViewState";

interface TaskQueueToolbarProps {
  activeFilterCount: number;
  bootstrap: BootstrapPayload;
  disciplineFilter: FilterSelection;
  disciplineOptions: DropdownOption[];
  isAllProjectsView: boolean;
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
  setTaskQueueZoom: Dispatch<SetStateAction<number>>;
  showSubsystemIterationFilter: boolean;
  sortField: TaskSortField;
  sortOrder: "asc" | "desc";
  statusFilter: FilterSelection;
  subsystemFilter: FilterSelection;
  subsystemFilterOptions: DropdownOption[];
  subsystemIterationFilter: FilterSelection;
  subsystemIterationOptions: DropdownOption[];
  taskSortIsDefault: boolean;
  taskQueueZoom: number;
}

export function TaskQueueToolbar({
  activeFilterCount,
  bootstrap,
  disciplineFilter,
  disciplineOptions,
  isAllProjectsView,
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
  setTaskQueueZoom,
  showSubsystemIterationFilter,
  sortField,
  sortOrder,
  statusFilter,
  subsystemFilter,
  subsystemFilterOptions,
  subsystemIterationFilter,
  subsystemIterationOptions,
  taskSortIsDefault,
  taskQueueZoom,
}: TaskQueueToolbarProps) {
  return (
    <div className="panel-actions filter-toolbar task-queue-toolbar">
      <TopbarResponsiveSearch
        actionCount={2}
        actions={
          <>
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
                  labelControl: (
                    <SortDirectionToggle direction={sortOrder} label="tasks" onChange={setSortOrder} />
                  ),
                  content: (
                    <select
                      aria-label="Sort tasks by"
                      className="task-queue-sort-menu-select"
                      onChange={(milestone) => setSortField(milestone.target.value as TaskSortField)}
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
              ]}
            />
          </>
        }
        ariaLabel="Search tasks"
        compactPlaceholder="Search"
        onChange={setSearchFilter}
        placeholder="Search tasks..."
        tutorialTarget="task-queue-search-input"
        value={searchFilter}
      />

      <WorkspaceTopbarZoom
        ariaLabel="Task queue zoom"
        canZoomIn={taskQueueZoom < TASK_QUEUE_ZOOM_MAX}
        canZoomOut={taskQueueZoom > TASK_QUEUE_ZOOM_MIN}
        decreaseLabel="Zoom out task queue"
        increaseLabel="Zoom in task queue"
        onZoomIn={() => setTaskQueueZoom((current) => clampTaskQueueZoom(current + TASK_QUEUE_ZOOM_STEP))}
        onZoomOut={() => setTaskQueueZoom((current) => clampTaskQueueZoom(current - TASK_QUEUE_ZOOM_STEP))}
        toolbarClassName="workspace-topbar-zoom-slot-actions"
        value={formatTaskQueueZoomLabel(taskQueueZoom)}
      />
    </div>
  );
}
