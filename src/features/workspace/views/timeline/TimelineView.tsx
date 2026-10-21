import { useRef, useState } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MeetingPayload, MilestonePayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { IconCalendar, IconTasks } from "@/components/shared/Icons";
import { WorkspaceTopbarControls, buildSingleAddMenuAction, buildTopbarAddMenuActions, makeAddMenuAction } from "@/features/workspace/shared/topbar";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import { ScheduleAgendaPanel, type ScheduleAgendaHandle } from "../taskCalendar/ScheduleAgendaPanel";
import { ProductTimelineGrid } from "./ProductTimelineGrid";
import { TimelineMilestoneLane } from "./TimelineMilestoneLane";
import { TimelineToolbar } from "./TimelineToolbar";
import { useTimelineViewData } from "./hooks/useTimelineViewData";
import { useTimelineViewFilters } from "./hooks/useTimelineViewFilters";
import { useTimelineViewState } from "./hooks/useTimelineViewState";
import { useTimelinePeriodNavigation } from "./hooks/useTimelinePeriodNavigation";

interface TimelineViewProps {
  onSaveMeeting: (payload: MeetingPayload) => Promise<void>;
  onCreateMilestoneReport?: (milestoneId: string, onReturn?: () => void) => void;
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  activePersonFilter: FilterSelection;
  setActivePersonFilter: (value: FilterSelection) => void;
  onTaskEditCanceled?: () => void;
  onTaskEditSaved?: () => void;
  openTaskDetailModal: (task: TaskRecord) => void;
  openCreateTaskModal: () => void;
  onDeleteTimelineMilestone: (milestoneId: string) => Promise<void>;
  onSaveTimelineMilestone: (mode: "create" | "edit", milestoneId: string | null, payload: MilestonePayload) => Promise<void>;
  triggerCreateMilestoneToken: number;
  searchFilter?: string;
  onSearchChange?: (value: string) => void;
}

export function TimelineView({
  onSaveMeeting, onCreateMilestoneReport, bootstrap, isAllProjectsView, activePersonFilter,
  setActivePersonFilter, onTaskEditCanceled, onTaskEditSaved, openTaskDetailModal, openCreateTaskModal,
  onDeleteTimelineMilestone, onSaveTimelineMilestone, triggerCreateMilestoneToken,
  searchFilter: controlledSearchFilter, onSearchChange,
}: TimelineViewProps) {
  const state = useTimelineViewState();
  const agendaRef = useRef<ScheduleAgendaHandle>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [localSearchFilter, setLocalSearchFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAgenda, setShowAgenda] = useState(true);
  const [mobilePresentation, setMobilePresentation] = useState<"agenda" | "timeline">("agenda");
  const searchFilter = controlledSearchFilter ?? localSearchFilter;
  const filterControls = useTimelineViewFilters({ activePersonFilter, bootstrap, isAllProjectsView });
  const data = useTimelineViewData({ activePersonFilter, bootstrap, isAllProjectsView, searchFilter,
    timelineFilters: filterControls.filters, viewAnchorDate: state.viewAnchorDate, viewInterval: state.viewInterval });
  const navigation = useTimelinePeriodNavigation({ days: data.days, goToToday: state.goToToday,
    onIntervalChange: state.handleTimelineIntervalChange, shiftTimelinePeriod: state.shiftTimelinePeriod,
    viewAnchorDate: state.viewAnchorDate, viewInterval: state.viewInterval });
  const navigate = (operation: () => void) => { setSelectedDate(null); operation(); };
  const selectDate = (day: string) => { setSelectedDate(day); setShowAgenda(true); setMobilePresentation("agenda"); };
  const fit = () => {
    state.fitTimeline();
    contentRef.current?.querySelector(".product-timeline-shell")?.scrollTo({ left: 0 });
  };
  return (
    <section className={`panel dense-panel timeline-layout ${WORKSPACE_PANEL_CLASS}`}>
      <AppTopbarSlotPortal slot="controls">
        <WorkspaceTopbarControls className="timeline-toolbar timeline-topbar-controls">
          <TimelineToolbar
            activeFilterCount={filterControls.activeFilterCount}
            activePersonFilter={activePersonFilter} bootstrap={bootstrap} isAllProjectsView={isAllProjectsView}
            workTypeFilter={filterControls.filters.workTypeFilter} workTypeFilterOptions={filterControls.workTypeFilterOptions}
            priorityFilter={filterControls.filters.priorityFilter} projectFilter={filterControls.filters.projectFilter}
            responsibleGroupFilter={filterControls.filters.responsibleGroupFilter ?? []}
            statusFilter={filterControls.filters.statusFilter} subsystemFilter={filterControls.filters.subsystemFilter}
            subsystemFilterOptions={filterControls.subsystemFilterOptions}
            setWorkTypeFilter={filterControls.setWorkTypeFilter} setPriorityFilter={filterControls.setPriorityFilter}
            setProjectFilter={filterControls.setProjectFilter} setResponsibleGroupFilter={filterControls.setResponsibleGroupFilter}
            setStatusFilter={filterControls.setStatusFilter} setSubsystemFilter={filterControls.setSubsystemFilter}
            searchFilter={searchFilter} onSearchChange={onSearchChange ?? setLocalSearchFilter}
            onChangePersonFilter={setActivePersonFilter} onAdjustZoom={state.adjustTimelineZoom}
            onIntervalChange={(interval) => navigate(() => navigation.handleTimelineIntervalChange(interval))}
            onShiftPeriod={(direction) => navigate(() => navigation.handleShiftPeriod(direction))}
            onToday={() => navigate(navigation.handleToday)} onFit={fit}
            timelinePeriodLabel={data.timelinePeriodLabel} timelineZoom={state.timelineZoom} viewInterval={state.viewInterval}
            showAgenda={showAgenda} onShowAgendaChange={setShowAgenda}
            mobilePresentation={mobilePresentation} onMobilePresentationChange={setMobilePresentation}
          />
          <WorkspaceTopbarAddMenu actions={buildTopbarAddMenuActions(
            makeAddMenuAction("Add meeting", () => window.dispatchEvent(new Event("mission-control:open-meeting")), <IconCalendar />),
            makeAddMenuAction("Add milestone", () => agendaRef.current?.createMilestone(), <IconTasks />),
            buildSingleAddMenuAction({ label: "Add task", onSelect: openCreateTaskModal })[0],
          )} ariaLabel="Add schedule item" title="Add schedule item" />
        </WorkspaceTopbarControls>
      </AppTopbarSlotPortal>
      <div className="schedule-gantt-agenda" data-agenda-visible={showAgenda} data-mobile-presentation={mobilePresentation} ref={contentRef}>
        <ProductTimelineGrid bootstrap={bootstrap} tasks={data.tasks} days={data.days} viewInterval={state.viewInterval}
          zoom={state.timelineZoom} selectedDate={selectedDate} onSelectDate={selectDate} onOpenTask={openTaskDetailModal}
          isAllProjectsView={isAllProjectsView}
          milestoneLane={<TimelineMilestoneLane days={data.days} milestones={data.milestones} onOpenMilestone={(id) => agendaRef.current?.openMilestone(id)} />} />
        <ScheduleAgendaPanel ref={agendaRef} bootstrap={bootstrap} isAllProjectsView={isAllProjectsView}
          startDate={data.days[0] ?? state.viewAnchorDate} endDate={data.days.at(-1) ?? null} events={data.agendaEvents}
          selectedDate={selectedDate} onClearSelectedDate={() => setSelectedDate(null)} triggerCreateMilestoneToken={triggerCreateMilestoneToken}
          onSaveMeeting={onSaveMeeting} onSaveTimelineMilestone={onSaveTimelineMilestone}
          onDeleteTimelineMilestone={onDeleteTimelineMilestone} onTaskDetailOpen={openTaskDetailModal}
          onCreateMilestoneReport={onCreateMilestoneReport} onTaskEditCanceled={onTaskEditCanceled} onTaskEditSaved={onTaskEditSaved} />
      </div>
    </section>
  );
}
