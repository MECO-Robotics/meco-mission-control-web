import { CircleHelp } from "lucide-react";
import { WorkspacePopover } from "@/features/workspace/shared/ui/WorkspacePopover";
import { getTimelineTaskStatusLabel, TimelineTaskStatusLogo } from "../TimelineTaskStatusLogo";
import { TIMELINE_STATUS_TONES } from "../model/timelineTaskColors";
import type { TimelineTaskStatusSignal } from "../timelineGridBodyUtils";
export function TimelineStatusLegend() {
  return <WorkspacePopover label="Status legend" trigger={<><CircleHelp size={14} aria-hidden="true" /><span>Legend</span></>}>
    <ul className="timeline-legend-list">{(Object.keys(TIMELINE_STATUS_TONES) as TimelineTaskStatusSignal[]).map((signal) =>
      <li key={signal}><TimelineTaskStatusLogo signal={signal} status="not-started" />{getTimelineTaskStatusLabel(signal)}</li>)}
      <li className="timeline-task-overdue">Overdue · days past due; unfinished work only</li>
    </ul>
  </WorkspacePopover>;
}
