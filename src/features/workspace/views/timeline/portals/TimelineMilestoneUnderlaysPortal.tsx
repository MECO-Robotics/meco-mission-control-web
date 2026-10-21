import { createPortal } from "react-dom";
import type { TimelineDayMilestoneUnderlay } from "../timelineViewModel";
export function TimelineMilestoneUnderlaysPortal({ portalTarget, underlays }: {
  portalTarget: HTMLElement | null;
  underlays: TimelineDayMilestoneUnderlay[];
}) {
  if (!portalTarget) return null;
  return createPortal(<>{underlays.map(({ id, geometry, startDay, endDay }) =>
    <div key={id} aria-hidden="true" className="timeline-milestone-guide"
      data-range-start={startDay} data-range-end={endDay}
      style={{ left: geometry.left, top: geometry.bodyTop, width: geometry.width, height: geometry.bodyHeight }} />
  )}</>, portalTarget);
}
