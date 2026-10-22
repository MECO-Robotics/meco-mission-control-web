import { useEffect, useId, useRef, useState } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MeetingPayload, MilestonePayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { IconCalendar, IconChevronLeft, IconChevronRight, IconTasks } from "@/components/shared/Icons";
import { WorkspaceTopbarControls, buildSingleAddMenuAction, buildTopbarAddMenuActions, makeAddMenuAction } from "@/features/workspace/shared/topbar";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import { ScheduleAgendaPanel, type ScheduleAgendaHandle } from "../taskCalendar/ScheduleAgendaPanel";
import { ProductTimelineGrid } from "./ProductTimelineGrid";
import type { GroupBy } from "./model/productTimelineModel";
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
  const agendaId = useId();
  const [localSearchFilter, setLocalSearchFilter] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("team");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAgenda, setShowAgenda] = useState(true);
  const [mobileAgendaOpen, setMobileAgendaOpen] = useState(false);
  const [isPhone, setIsPhone] = useState(() => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(max-width: 767px)").matches);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => { setIsPhone(media.matches); if (!media.matches) setMobileAgendaOpen(false); };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const searchFilter = controlledSearchFilter ?? localSearchFilter;
  const filterControls = useTimelineViewFilters({ activePersonFilter, bootstrap, isAllProjectsView });
  const data = useTimelineViewData({ activePersonFilter, bootstrap, isAllProjectsView, searchFilter,
    timelineFilters: filterControls.filters, viewAnchorDate: state.viewAnchorDate, viewInterval: state.viewInterval });
  const navigation = useTimelinePeriodNavigation({ days: data.days, goToToday: state.goToToday,
    onIntervalChange: state.handleTimelineIntervalChange, shiftTimelinePeriod: state.shiftTimelinePeriod,
    viewAnchorDate: state.viewAnchorDate, viewInterval: state.viewInterval });
  const navigate = (operation: () => void) => { setSelectedDate(null); operation(); };
  const selectDate = (day: string) => { setSelectedDate(day); if (isPhone) setMobileAgendaOpen(true); else setShowAgenda(true); };
  return (
    <section className={`panel dense-panel timeline-layout ${WORKSPACE_PANEL_CLASS}`}>
      <AppTopbarSlotPortal slot="controls">
        <WorkspaceTopbarControls className="timeline-toolbar timeline-topbar-controls">
          <TimelineToolbar
            groupBy={groupBy} onGroupByChange={setGroupBy}
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
            onToday={() => navigate(navigation.handleToday)}
            timelinePeriodLabel={data.timelinePeriodLabel} timelineZoom={state.timelineZoom} viewInterval={state.viewInterval}
          />
          <WorkspaceTopbarAddMenu actions={buildTopbarAddMenuActions(
            makeAddMenuAction("Add meeting", () => window.dispatchEvent(new Event("mission-control:open-meeting")), <IconCalendar />),
            makeAddMenuAction("Add milestone", () => agendaRef.current?.createMilestone(), <IconTasks />),
            buildSingleAddMenuAction({ label: "Add task", onSelect: openCreateTaskModal })[0],
          )} ariaLabel="Add schedule item" title="Add schedule item" />
        </WorkspaceTopbarControls>
      </AppTopbarSlotPortal>
      <div className="schedule-gantt-agenda" data-agenda-visible={!isPhone && showAgenda}>
        <ProductTimelineGrid bootstrap={bootstrap} tasks={data.tasks} days={data.days} groupBy={groupBy}
          zoom={state.timelineZoom} selectedDate={selectedDate} onSelectDate={selectDate} onOpenTask={openTaskDetailModal}
          isAllProjectsView={isAllProjectsView}
          milestoneLane={<TimelineMilestoneLane days={data.days} milestones={data.milestones} onOpenMilestone={(id) => agendaRef.current?.openMilestone(id)} />} />
        <button
          aria-controls={agendaId} aria-expanded={isPhone ? mobileAgendaOpen : showAgenda} aria-haspopup={isPhone ? "dialog" : undefined} aria-label={isPhone ? "Open agenda" : showAgenda ? "Collapse agenda" : "Expand agenda"}
          className={`icon-button schedule-agenda-toggle${isPhone ? " is-floating" : ""}`} onClick={() => isPhone ? setMobileAgendaOpen(true) : setShowAgenda((visible) => !visible)}
          title={isPhone ? "Open agenda" : showAgenda ? "Collapse agenda" : "Expand agenda"} type="button"
        >
          {!isPhone && showAgenda ? <IconChevronRight /> : <IconChevronLeft />}
        </button>
        <ScheduleAgendaPanel id={agendaId} ref={agendaRef} bootstrap={bootstrap} isAllProjectsView={isAllProjectsView}
          presentation={isPhone ? "modal" : "inline"} isVisible={isPhone ? mobileAgendaOpen : showAgenda} onClose={() => setMobileAgendaOpen(false)}
          startDate={data.days[0] ?? state.viewAnchorDate} endDate={data.days.at(-1) ?? null} events={data.agendaEvents}
          selectedDate={selectedDate} onClearSelectedDate={() => setSelectedDate(null)} triggerCreateMilestoneToken={triggerCreateMilestoneToken}
          onSaveMeeting={onSaveMeeting} onSaveTimelineMilestone={onSaveTimelineMilestone}
          onDeleteTimelineMilestone={onDeleteTimelineMilestone} onTaskDetailOpen={openTaskDetailModal}
          onCreateMilestoneReport={onCreateMilestoneReport} onTaskEditCanceled={onTaskEditCanceled} onTaskEditSaved={onTaskEditSaved} />
      </div>
    </section>
  );
}
