import { useCallback, useMemo } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestonePayload } from "@/types/payloads";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { formatTimelinePeriodLabel } from "@/features/workspace/shared/timeline/timelineDateUtils";
import type { TimelineViewInterval } from "@/features/workspace/shared/timeline/timelineDateUtils";
import { buildTimelineData } from "../model/timelineViewDataCore";
import { buildTimelineDayHeaderCells, buildTimelineMonthGroups, buildTimelineProjectRows } from "../model/timelineViewDataPresentation";
import type { TimelineTaskFilters } from "../model/timelineViewFilters";
import { useTimelineMilestoneModal } from "../useTimelineEventModal";
import { useTimelineMilestoneOverlay } from "./useTimelineMilestoneOverlay";
import { useTimelineRowHighlightGeometry } from "./useTimelineRowHighlightGeometry";
import { useTimelineViewScope } from "./useTimelineViewScope";
import { resolveTimelineRowHighlightStyle } from "../model/timelineTaskColors";

interface UseTimelineViewDataArgs {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  openCreateTaskModal: () => void;
  onTaskEditCanceled: () => void;
  onTaskEditSaved: () => void;
  onDeleteTimelineMilestone: (milestoneId: string) => Promise<void>;
  onSaveTimelineMilestone: (
    mode: "create" | "edit",
    milestoneId: string | null,
    payload: MilestonePayload,
  ) => Promise<void>;
  searchFilter: string;
  timelineFilters: TimelineTaskFilters;
  timelineZoom: number;
  triggerCreateMilestoneToken: number;
  viewAnchorDate: string;
  viewInterval: TimelineViewInterval;
}

export function useTimelineViewData({
  activePersonFilter,
  bootstrap,
  isAllProjectsView,
  openCreateTaskModal,
  onTaskEditCanceled,
  onTaskEditSaved,
  onDeleteTimelineMilestone,
  onSaveTimelineMilestone,
  searchFilter,
  timelineFilters,
  timelineZoom,
  triggerCreateMilestoneToken,
  viewAnchorDate,
  viewInterval,
}: UseTimelineViewDataArgs) {
  const {
    disciplinesById,
    projectsById,
    scopedMeetings,
    scopedMilestones,
    scopedProjectIds,
    scopedSubsystems,
    scopedTasks,
    subsystemsById,
    tasksById,
    timelineFilterMotionClass,
  } = useTimelineViewScope({
    activePersonFilter,
    bootstrap,
    isAllProjectsView,
    searchFilter,
    timelineFilters,
  });
  const timeline = useMemo(
    () =>
      buildTimelineData({
        isAllProjectsView,
        meetings: scopedMeetings,
        milestones: scopedMilestones,
        projectsById,
        scopedSubsystems,
        scopedTasks,
        viewAnchorDate,
        viewInterval,
      }),
    [
      isAllProjectsView,
      projectsById,
      scopedMeetings,
      scopedMilestones,
      scopedSubsystems,
      scopedTasks,
      viewAnchorDate,
      viewInterval,
    ],
  );
  const timelinePeriodLabel = useMemo(
    () => formatTimelinePeriodLabel(viewInterval, timeline.days),
    [timeline.days, viewInterval],
  );
  const monthGroups = useMemo(() => buildTimelineMonthGroups(timeline.days), [timeline.days]);
  const dayMilestonesByDate = timeline.dayMilestones;
  const dayMeetingsByDate = timeline.dayMeetings;
  const milestoneModal = useTimelineMilestoneModal({
    dayMilestonesByDate,
    openCreateTaskModal,
    onTaskEditCanceled,
    onTaskEditSaved,
    onDeleteTimelineMilestone,
    onSaveTimelineMilestone,
    scopedProjectIds,
    triggerCreateMilestoneToken,
  });
  const timelineDayHeaderCells = useMemo(
    () => buildTimelineDayHeaderCells(timeline.days, dayMilestonesByDate, dayMeetingsByDate),
    [dayMeetingsByDate, dayMilestonesByDate, timeline.days],
  );
  const projectRows = useMemo(
    () => buildTimelineProjectRows(timeline.subsystemRows),
    [timeline.subsystemRows],
  );

  const {
    clearHoveredMilestonePopup,
    handleTimelineDayMouseEnter,
    queueTimelineLayerUpdate,
    resolveMilestonePopupGeometry,
    showMilestoneUnderlayPopup,
    setHoveredMilestonePopupLayerRef,
    timelineDayCellRefs,
    timelineDayMilestoneUnderlays,
    timelineGridRef,
    timelineShellRef,
    timelineTodayMarkerLabelTop,
    timelineTodayMarkerLineLeft,
    timelineTodayMarkerLeft,
    isTimelineShellScrolling,
    tooltipPortalTarget,
  } = useTimelineMilestoneOverlay({
    days: timeline.days,
    dayMilestonesByDate,
    milestones: scopedMilestones,
    timelineZoom,
  });

  const resolveRowHighlightGeometry = useTimelineRowHighlightGeometry(timelineShellRef);

  const resolveTaskRowHighlightStyle = useCallback(
    (anchorKey: string) =>
      resolveTimelineRowHighlightStyle(anchorKey, tasksById, subsystemsById, disciplinesById),
    [disciplinesById, subsystemsById, tasksById],
  );
  const modalPortalTarget =
    typeof document !== "undefined"
      ? ((document.querySelector(".page-shell") as HTMLElement | null) ?? document.body)
      : null;

  return {
    clearHoveredMilestonePopup,
    disciplinesById,
    dayMilestonesByDate,
    milestoneModal,
    handleTimelineDayMouseEnter,
    isTimelineShellScrolling,
    monthGroups,
    projectRows,
    projectsById,
    queueTimelineLayerUpdate,
    resolveMilestonePopupGeometry,
    resolveRowHighlightGeometry,
    resolveTaskRowHighlightStyle,
    scopedMilestones,
    scopedProjectIds,
    scopedTasks,
    setHoveredMilestonePopupLayerRef,
    subsystemsById,
    tasksById,
    timeline,
    timelineDayCellRefs,
    timelineDayHeaderCells,
    timelineDayMilestoneUnderlays,
    timelineFilterMotionClass,
    timelineGridRef,
    timelinePeriodLabel,
    timelineShellRef,
    timelineTodayMarkerLabelTop,
    timelineTodayMarkerLineLeft,
    timelineTodayMarkerLeft,
    modalPortalTarget,
    showMilestoneUnderlayPopup,
    tooltipPortalTarget,
  };
}
