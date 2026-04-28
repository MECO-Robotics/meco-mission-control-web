import React from "react";
import { createPortal } from "react-dom";
import type { TimelineDayMilestoneUnderlay } from "./timelineViewModel";

interface TimelineMilestoneUnderlaysPortalProps {
  portalTarget: HTMLElement | null;
  underlays: TimelineDayMilestoneUnderlay[];
}

export const TimelineMilestoneUnderlaysPortal: React.FC<TimelineMilestoneUnderlaysPortalProps> = ({
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
          aria-hidden="true"
          key={`timeline-underlay-${underlay.id}`}
          className="timeline-day-event-underlay"
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
            zIndex: 4 + underlay.stackOrder,
          }}
        >
          <div
            style={{
              display: "grid",
              gap: "0.28rem",
              justifyItems: "center",
              transform: `rotate(${underlay.rotationDeg}deg)`,
              transformOrigin: "center",
            }}
          >
            {underlay.lines.map((line, index) => (
              <span
                className="timeline-day-event-overlay-tooltip-item"
                key={`${underlay.id}-${line}-${index}`}
              >
                {line}
              </span>
            ))}
          </div>
        </div>
      ))}
    </>,
    portalTarget,
  );
};
