import React from "react";
import { createPortal } from "react-dom";
import type { MilestoneRecord } from "@/types/recordsExecution";
import type { TimelineDayMilestoneUnderlay } from "../timelineViewModel";

interface TimelineMilestoneUnderlaysPortalProps {
  portalTarget: HTMLElement | null;
  onOpenMilestoneDetails: (milestone: MilestoneRecord) => void;
  onShowMilestonePopup: (target: HTMLElement, milestone: MilestoneRecord) => void;
  onHideMilestonePopup: () => void;
  underlays: TimelineDayMilestoneUnderlay[];
}

export const TimelineMilestoneUnderlaysPortal: React.FC<TimelineMilestoneUnderlaysPortalProps> = ({
  onHideMilestonePopup,
  onOpenMilestoneDetails,
  onShowMilestonePopup,
  portalTarget,
  underlays,
}) => {
  if (!portalTarget || underlays.length === 0) {
    return null;
  }

  return createPortal(
    <>
      {underlays.map((underlay) => (
        <div
          key={`timeline-underlay-${underlay.id}`}
          className="timeline-day-milestone-underlay"
          onMouseEnter={(event) => onShowMilestonePopup(event.currentTarget, underlay.milestone)}
          onMouseLeave={onHideMilestonePopup}
          title={underlay.lines.join(", ")}
          style={{
            left: `${underlay.geometry.left + underlay.horizontalOffset}px`,
            top: `${underlay.geometry.bodyTop}px`,
            height: `${underlay.geometry.bodyHeight}px`,
            width: `${underlay.geometry.width}px`,
            transform: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: underlay.color,
            pointerEvents: "auto",
            zIndex: 4 + underlay.stackOrder,
          }}
        >
          <button
            aria-label={`Open milestone ${underlay.milestone.title}`}
            className="timeline-day-milestone-underlay-label"
            onClick={() => onOpenMilestoneDetails(underlay.milestone)}
            type="button"
            style={{ transform: `rotate(${underlay.rotationDeg}deg)` }}
          >
            {underlay.lines.map((line, index) => (
              <span
                className="timeline-day-milestone-overlay-tooltip-item"
                key={`${underlay.id}-${line}-${index}`}
              >
                {line}
              </span>
            ))}
          </button>
        </div>
      ))}
    </>,
    portalTarget,
  );
};
