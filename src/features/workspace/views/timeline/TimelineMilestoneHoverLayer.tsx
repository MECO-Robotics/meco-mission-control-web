import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { HoveredMilestonePopup } from "@/features/workspace/shared/timelineEventHelpers";
import type { MilestoneGeometry } from "./timelineViewModel";
import { withColumnOverlayTint } from "@/features/workspace/shared/timelineDateUtils";

interface TimelineMilestoneHoverLayerProps {
  controllerRef: React.MutableRefObject<(popup: HoveredMilestonePopup | null) => void>;
  portalTarget: HTMLElement | null;
  resolveGeometry: (
    popupStartDay: string | null,
    popupEndDay: string | null,
  ) => MilestoneGeometry | null;
}

const TimelineMilestoneHoverLayerComponent: React.FC<TimelineMilestoneHoverLayerProps> = ({
  controllerRef,
  portalTarget,
  resolveGeometry,
}) => {
  const [popup, setPopup] = useState<HoveredMilestonePopup | null>(null);

  useEffect(() => {
    controllerRef.current = setPopup;
    return () => {
      controllerRef.current = () => undefined;
    };
  }, [controllerRef]);

  const geometry = popup ? resolveGeometry(popup.anchorStartDay, popup.anchorEndDay) : null;

  if (!popup || !geometry || !portalTarget) {
    return null;
  }

  return createPortal(
    <>
      <div
        aria-hidden="true"
        className="timeline-day-event-overlay-column"
        style={{
          background: withColumnOverlayTint(popup.background),
          height: `${geometry.bodyHeight}px`,
          left: `${geometry.left}px`,
          top: `${geometry.bodyTop}px`,
          width: `${geometry.width}px`,
        }}
      />
      <div
        className="timeline-day-event-overlay-tooltip"
        role="presentation"
        style={{
          left: `${geometry.left}px`,
          top: `${geometry.bodyTop}px`,
          height: `${geometry.bodyHeight}px`,
          width: `${geometry.width}px`,
          transform: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            display: "grid",
            gap: "0.28rem",
            justifyItems: "center",
            transform: `rotate(${popup.rotationDeg}deg)`,
            transformOrigin: "center",
          }}
        >
          {popup.lines.map((line, index) => (
            <span className="timeline-day-event-overlay-tooltip-item" key={`${line}-${index}`}>
              {line}
            </span>
          ))}
        </div>
      </div>
    </>,
    portalTarget,
  );
};

TimelineMilestoneHoverLayerComponent.displayName = "TimelineMilestoneHoverLayer";

export const TimelineMilestoneHoverLayer = React.memo(TimelineMilestoneHoverLayerComponent);
