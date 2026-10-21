import { useMemo } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { formatTimelinePeriodLabel } from "@/features/workspace/shared/timeline/timelineDateUtils";
import type { TimelineViewInterval } from "@/features/workspace/shared/timeline/timelineDateUtils";
import { buildTaskCalendarEvents } from "../../taskCalendar/taskCalendarEvents";
import { buildTimelineDateRange, buildTimelineDays } from "../model/timelineViewDataCore";
import type { TimelineTaskFilters } from "../model/timelineViewFilters";
import { useTimelineViewScope } from "./useTimelineViewScope";

export function useTimelineViewData({
  activePersonFilter, bootstrap, isAllProjectsView, searchFilter, timelineFilters, viewAnchorDate, viewInterval,
}: {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  searchFilter: string;
  timelineFilters: TimelineTaskFilters;
  viewAnchorDate: string;
  viewInterval: TimelineViewInterval;
}) {
  const scope = useTimelineViewScope({ activePersonFilter, bootstrap, isAllProjectsView, searchFilter, timelineFilters });
  const { scopedTasks, scopedMilestones, scopedMeetings, projectsById } = scope;
  const days = useMemo(() => {
    const { startDate, endDate } = buildTimelineDateRange({ tasks: scopedTasks, milestones: scopedMilestones, meetings: scopedMeetings, viewAnchorDate, viewInterval });
    return buildTimelineDays(startDate, endDate);
  }, [scopedTasks, scopedMilestones, scopedMeetings, viewAnchorDate, viewInterval]);
  const agendaEvents = useMemo(() => buildTaskCalendarEvents({
    activePersonFilter: [],
    bootstrap: { ...bootstrap, tasks: scopedTasks, milestones: scopedMilestones, meetings: scopedMeetings },
    isAllProjectsView,
    projectsById,
  }), [bootstrap, isAllProjectsView, projectsById, scopedMeetings, scopedMilestones, scopedTasks]);
  return {
    days,
    tasks: scopedTasks,
    milestones: scopedMilestones,
    agendaEvents,
    timelinePeriodLabel: formatTimelinePeriodLabel(viewInterval, days),
  };
}
