import { useCallback, useMemo } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestonePayload } from "@/types/payloads";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { filterSelectionMatchesTaskPeople, useFilterChangeMotionClass } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { formatTimelinePeriodLabel } from "@/features/workspace/shared/timeline/timelineDateUtils";
import type { TimelineViewInterval } from "@/features/workspace/shared/timeline/timelineDateUtils";
import { buildTimelineData } from "../model/timelineViewDataCore";
import { buildTimelineDayHeaderCells, buildTimelineMonthGroups, buildTimelineProjectRows, filterTimelineMilestonesByPersonSelection } from "../model/timelineViewDataPresentation";
import { useTimelineMilestoneModal } from "../useTimelineEventModal";
import { useTimelineMilestoneOverlay } from "./useTimelineMilestoneOverlay";
import { useTimelineRowHighlightGeometry } from "./useTimelineRowHighlightGeometry";
import { resolveTimelineRowHighlightStyle } from "../timelineTaskColors";

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
  timelineZoom,
  triggerCreateMilestoneToken,
  viewAnchorDate,
  viewInterval,
}: UseTimelineViewDataArgs) {
  const projectsById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.projects.map((project) => [project.id, project]),
      ) as Record<string, BootstrapPayload["projects"][number]>,
    [bootstrap.projects],
  );
  const scopedProjectIds = useMemo(
    () => bootstrap.projects.map((project) => project.id),
    [bootstrap.projects],
  );
  const subsystemsById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.subsystems.map((subsystem) => [subsystem.id, subsystem]),
      ) as Record<string, BootstrapPayload["subsystems"][number]>,
    [bootstrap.subsystems],
  );
  const disciplinesById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.disciplines.map((discipline) => [discipline.id, discipline]),
      ) as Record<string, BootstrapPayload["disciplines"][number]>,
    [bootstrap.disciplines],
  );

  const scopedTasks = useMemo(
    () =>
      activePersonFilter.length > 0
        ? bootstrap.tasks.filter((task) => filterSelectionMatchesTaskPeople(activePersonFilter, task))
        : bootstrap.tasks,
    [activePersonFilter, bootstrap.tasks],
  );
  const scopedMilestones = useMemo(
    () =>
      filterTimelineMilestonesByPersonSelection({
        activePersonFilter,
        milestones: bootstrap.milestones,
        tasks: bootstrap.tasks,
      }),
    [activePersonFilter, bootstrap.milestones, bootstrap.tasks],
  );
  const tasksById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.tasks.map((task) => [task.id, task]),
      ) as Record<string, BootstrapPayload["tasks"][number]>,
    [bootstrap.tasks],
  );
  const timelineFilterMotionClass = useFilterChangeMotionClass([activePersonFilter]);
  const timeline = useMemo(
    () =>
      buildTimelineData({
        isAllProjectsView,
        milestones: scopedMilestones,
        projectsById,
        scopedSubsystems: bootstrap.subsystems,
        scopedTasks,
        viewAnchorDate,
        viewInterval,
      }),
    [
      bootstrap.subsystems,
      isAllProjectsView,
      projectsById,
      scopedMilestones,
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
    () => buildTimelineDayHeaderCells(timeline.days, dayMilestonesByDate),
    [dayMilestonesByDate, timeline.days],
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
