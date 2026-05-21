import { useCallback, useMemo } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestonePayload } from "@/types/payloads";
import { isMeetingVisibleInProjectScope } from "@/features/workspace/shared/events";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { filterSelectionMatchesTaskPeople, useFilterChangeMotionClass } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { formatTimelinePeriodLabel } from "@/features/workspace/shared/timeline/timelineDateUtils";
import type { TimelineViewInterval } from "@/features/workspace/shared/timeline/timelineDateUtils";
import { buildTimelineData } from "../model/timelineViewDataCore";
import { buildTimelineDayHeaderCells, buildTimelineMonthGroups, buildTimelineProjectRows, filterTimelineMilestonesByPersonSelection } from "../model/timelineViewDataPresentation";
import { useTimelineMilestoneModal } from "../useTimelineEventModal";
import { useTimelineMilestoneOverlay } from "./useTimelineMilestoneOverlay";
import { useTimelineRowHighlightGeometry } from "./useTimelineRowHighlightGeometry";
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
  const scopedProjectIdSet = useMemo(() => new Set(scopedProjectIds), [scopedProjectIds]);
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

  const normalizedSearch = searchFilter.trim().toLowerCase();
  const scopedTasksByPerson = useMemo(
    () =>
      activePersonFilter.length > 0
        ? bootstrap.tasks.filter((task) => filterSelectionMatchesTaskPeople(activePersonFilter, task))
        : bootstrap.tasks,
    [activePersonFilter, bootstrap.tasks],
  );
  const scopedTasks = useMemo(() => {
    if (normalizedSearch.length === 0) {
      return scopedTasksByPerson;
    }

    return scopedTasksByPerson.filter((task) => {
      const subsystemIds = task.subsystemIds.length > 0 ? task.subsystemIds : [task.subsystemId];
      const subsystemLabels = subsystemIds.map((subsystemId) => subsystemsById[subsystemId]?.name ?? "");
      const projectLabel = projectsById[task.projectId]?.name ?? "";

      return [
        task.title,
        task.summary,
        task.status,
        task.priority,
        projectLabel,
        ...subsystemLabels,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [normalizedSearch, projectsById, scopedTasksByPerson, subsystemsById]);
  const scopedSubsystems = useMemo(() => {
    if (normalizedSearch.length === 0) {
      return bootstrap.subsystems;
    }

    const taskSubsystemIds = new Set(
      scopedTasks.flatMap((task) => (task.subsystemIds.length > 0 ? task.subsystemIds : [task.subsystemId])),
    );

    return bootstrap.subsystems.filter((subsystem) => {
      const projectLabel = projectsById[subsystem.projectId]?.name ?? "";
      const subsystemMatches = [subsystem.name, projectLabel]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);

      return subsystemMatches || taskSubsystemIds.has(subsystem.id);
    });
  }, [bootstrap.subsystems, normalizedSearch, projectsById, scopedTasks]);
  const scopedMilestones = useMemo(
    () => {
      const milestonesByPerson = filterTimelineMilestonesByPersonSelection({
        activePersonFilter,
        milestones: bootstrap.milestones,
        tasks: bootstrap.tasks,
      });

      if (normalizedSearch.length === 0) {
        return milestonesByPerson;
      }

      return milestonesByPerson.filter((milestone) => {
        const projectLabels = milestone.projectIds.map((projectId) => projectsById[projectId]?.name ?? "");

        return [
          milestone.title,
          milestone.description,
          milestone.type,
          milestone.status,
          ...projectLabels,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      });
    },
    [activePersonFilter, bootstrap.milestones, bootstrap.tasks, normalizedSearch, projectsById],
  );
  const scopedMeetings = useMemo(() => {
    const meetings = (bootstrap.meetings ?? []).filter((meeting) =>
      isMeetingVisibleInProjectScope(meeting, scopedProjectIdSet),
    );
    if (normalizedSearch.length === 0) {
      return meetings;
    }

    return meetings.filter((meeting) => {
      const projectLabels = (meeting.projectIds ?? []).map((projectId) => projectsById[projectId]?.name ?? "");

      return [
        meeting.title,
        meeting.meetingType,
        meeting.location,
        meeting.description,
        ...projectLabels,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [bootstrap.meetings, normalizedSearch, projectsById, scopedProjectIdSet]);
  const tasksById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.tasks.map((task) => [task.id, task]),
      ) as Record<string, BootstrapPayload["tasks"][number]>,
    [bootstrap.tasks],
  );
  const timelineFilterMotionClass = useFilterChangeMotionClass([activePersonFilter, searchFilter]);
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
