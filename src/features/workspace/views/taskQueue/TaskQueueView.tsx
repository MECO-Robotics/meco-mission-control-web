import type { BootstrapPayload, TaskRecord } from "@/types";
import type { FilterSelection } from "@/features/workspace/shared/filters";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model";
import { TaskQueueBoardSection } from "./TaskQueueBoardSection";
import { TaskQueueToolbar } from "./TaskQueueToolbar";
import {
  useTaskQueueViewState,
} from "./taskQueueViewState";

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
  const {
    activeFilterCount,
    activePersonFilterLabel,
    disciplineFilter,
    disciplineOptions,
    focusedBoardState,
    ownerFilter,
    priorityFilter,
    processedTasks,
    projectFilter,
    projectsById,
    searchFilter,
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

  return (
    <section className={`panel dense-panel task-queue-view ${WORKSPACE_PANEL_CLASS}`}>
      <TaskQueueToolbar
        activeFilterCount={activeFilterCount}
        activePersonFilterLabel={activePersonFilterLabel}
        bootstrap={bootstrap}
        disciplineFilter={disciplineFilter}
        disciplineOptions={disciplineOptions}
        isAllProjectsView={isAllProjectsView}
        openCreateTaskModal={openCreateTaskModal}
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
        showSubsystemIterationFilter={showSubsystemIterationFilter}
        sortField={sortField}
        sortOrder={sortOrder}
        statusFilter={statusFilter}
        subsystemFilter={subsystemFilter}
        subsystemFilterOptions={subsystemFilterOptions}
        subsystemIterationFilter={subsystemIterationFilter}
        subsystemIterationOptions={subsystemIterationOptions}
        taskSortIsDefault={taskSortIsDefault}
      />

      <TaskQueueBoardSection
        bootstrap={bootstrap}
        disciplinesById={disciplinesById}
        focusedBoardState={focusedBoardState}
        isNonRobotProject={isNonRobotProject}
        membersById={membersById}
        openEditTaskModal={openEditTaskModal}
        processedTasks={processedTasks}
        projectsById={projectsById}
        setFocusedBoardState={setFocusedBoardState}
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

