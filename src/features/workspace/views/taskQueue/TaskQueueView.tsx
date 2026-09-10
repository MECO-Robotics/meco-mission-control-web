import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskStatus } from "@/types/common";
import type { OpenEditTaskModalOptions } from "@/types/taskEditIntent";
import type { TaskRecord } from "@/types/recordsExecution";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import {
  WorkspaceTopbarControls,
  buildSingleAddMenuAction,
} from "@/features/workspace/shared/topbar";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import { TaskQueueBoardSection } from "./TaskQueueBoardSection";
import { TaskQueueToolbar } from "./TaskQueueToolbar";
import {
  useTaskQueueViewState,
} from "./taskQueueViewState";

interface TaskQueueViewProps {
  currentMemberId?: string | null;
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  isAllProjectsView: boolean;
  isNonRobotProject: boolean;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  openCreateTaskModal: () => void;
  openEditTaskModal: (task: TaskRecord, options?: OpenEditTaskModalOptions) => void;
  onReassignTaskStatus?: (task: TaskRecord, status: TaskStatus) => void | Promise<void>;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
}

export function TaskQueueView({
  currentMemberId,
  activePersonFilter,
  bootstrap,
  disciplinesById,
  isAllProjectsView,
  isNonRobotProject,
  membersById,
  openCreateTaskModal,
  openEditTaskModal,
  onReassignTaskStatus,
  subsystemsById,
}: TaskQueueViewProps) {
  const {
    activeFilterCount,
    disciplineFilter,
    disciplineOptions,
    focusedBoardState,
    ownerFilter,
    priorityFilter,
    processedTasks,
    projectFilter,
    projectsById,
    searchFilter,
    setTaskQueueZoom,
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
    setVisibleTaskCount,
    sortField,
    sortOrder,
    statusFilter,
    subsystemFilter,
    subsystemFilterOptions,
    subsystemIterationFilter,
    subsystemIterationOptions,
    taskQueueZoom,
    taskFilterMotionClass,
    taskSortIsDefault,
    visibleTaskCount,
    workstreamsById,
    showProjectContextOnCards,
    showProjectOnCards,
    showSubsystemIterationFilter,
  } = useTaskQueueViewState({
    activePersonFilter,
    bootstrap,
    disciplinesById,
    isAllProjectsView,
    membersById,
    subsystemsById,
  });

  const preset = ownerFilter.length === 1 && ownerFilter[0] === currentMemberId && statusFilter.length === 0
    ? "mine"
    : ownerFilter.length === 0 && statusFilter.length === 1 && statusFilter[0] === "waiting-for-qa"
      ? "qa"
      : ownerFilter.length === 0 && statusFilter.length === 2 && statusFilter.includes("blocked") && statusFilter.includes("waiting-on-dependency")
        ? "blocked"
        : ownerFilter.length === 0 && statusFilter.length === 0 ? "all" : null;

  return (
    <section className={`panel dense-panel task-queue-view ${WORKSPACE_PANEL_CLASS}`}>
      <AppTopbarSlotPortal slot="controls">
        <WorkspaceTopbarControls className="task-queue-toolbar">
          <TaskQueueToolbar
            activeFilterCount={activeFilterCount}
            bootstrap={bootstrap}
            disciplineFilter={disciplineFilter}
            disciplineOptions={disciplineOptions}
            isAllProjectsView={isAllProjectsView}
            ownerFilter={ownerFilter}
            priorityFilter={priorityFilter}
            projectFilter={projectFilter}
            searchFilter={searchFilter}
            setDisciplineFilter={setDisciplineFilter}
            setOwnerFilter={setOwnerFilter}
            setPriorityFilter={setPriorityFilter}
            setProjectFilter={setProjectFilter}
            setSearchFilter={setSearchFilter}
            setSortField={setSortField}
            setSortOrder={setSortOrder}
            setStatusFilter={setStatusFilter}
            setSubsystemFilter={setSubsystemFilter}
            setSubsystemIterationFilter={setSubsystemIterationFilter}
            setTaskQueueZoom={setTaskQueueZoom}
            showSubsystemIterationFilter={showSubsystemIterationFilter}
            sortField={sortField}
            sortOrder={sortOrder}
            statusFilter={statusFilter}
            subsystemFilter={subsystemFilter}
            subsystemFilterOptions={subsystemFilterOptions}
            subsystemIterationFilter={subsystemIterationFilter}
            subsystemIterationOptions={subsystemIterationOptions}
            taskSortIsDefault={taskSortIsDefault}
            taskQueueZoom={taskQueueZoom}
          />
          <WorkspaceTopbarAddMenu
            actions={buildSingleAddMenuAction({
              label: "Add task",
              onSelect: openCreateTaskModal,
            })}
            ariaLabel="Add task"
            title="Add task"
            tutorialTarget="create-task-button"
          />
        </WorkspaceTopbarControls>
      </AppTopbarSlotPortal>

      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Tasks</h2>
        </div>
      </div>

      <div className="workspace-presentation-controls" role="group" aria-label="Task presets">
        {([ ["all", "All work"], ["mine", "My work"], ["blocked", "Blocked"], ["qa", "Waiting for QA"] ] as const).map(([value, label]) => <button key={value} className="ghost-button" disabled={value === "mine" && !currentMemberId} aria-pressed={preset === value} onClick={() => { setOwnerFilter(value === "mine" && currentMemberId ? [currentMemberId] : []); setStatusFilter(value === "blocked" ? ["blocked", "waiting-on-dependency"] : value === "qa" ? ["waiting-for-qa"] : []); setFocusedBoardState(null); }} type="button">{label}</button>)}
      </div>
      <TaskQueueBoardSection
        bootstrap={bootstrap}
        disciplinesById={disciplinesById}
        focusedBoardState={focusedBoardState}
        isNonRobotProject={isNonRobotProject}
        membersById={membersById}
        openEditTaskModal={openEditTaskModal}
        onReassignTaskStatus={onReassignTaskStatus}
        processedTasks={processedTasks}
        projectsById={projectsById}
        taskQueueZoom={taskQueueZoom}
        setFocusedBoardState={setFocusedBoardState}
        setTaskQueueZoom={setTaskQueueZoom}
        setVisibleTaskCount={setVisibleTaskCount}
        showProjectContextOnCards={showProjectContextOnCards}
        showProjectOnCards={showProjectOnCards}
        subsystemsById={subsystemsById}
        taskFilterMotionClass={taskFilterMotionClass}
        visibleTaskCount={visibleTaskCount}
        workstreamsById={workstreamsById}
      />
    </section>
  );
}
