import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { HoveredMilestonePopup } from "@/features/workspace/shared/timeline/timelineEventHelpers";
import type { MilestoneGeometry } from "./timelineViewModel";
import { withColumnOverlayTint } from "@/features/workspace/shared/timeline/timelineDateUtils";

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
        className="timeline-day-milestone-overlay-column"
        style={{
          background: withColumnOverlayTint(popup.background),
          height: `${geometry.bodyHeight}px`,
          left: `${geometry.left}px`,
          top: `${geometry.bodyTop}px`,
          width: `${geometry.width}px`,
        }}
      />
      <div
        className="timeline-day-milestone-overlay-tooltip"
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
        {popup.lines.map((line, index) => {
          const horizontalOffset = popup.lineOffsets[index] ?? 0;

          return (
            <span
              className="timeline-day-milestone-overlay-tooltip-lane"
              key={`${line}-${index}`}
              style={{
                left: `calc(50% + ${horizontalOffset}px)`,
              }}
            >
              <span
                className="timeline-day-milestone-overlay-tooltip-item"
                style={{
                  transform: `rotate(${popup.rotationDeg}deg)`,
                  transformOrigin: "center",
                }}
              >
                {line}
              </span>
            </span>
          );
        })}
      </div>
    </>,
    portalTarget,
  );
};

TimelineMilestoneHoverLayerComponent.displayName = "TimelineMilestoneHoverLayer";

export const TimelineMilestoneHoverLayer = React.memo(TimelineMilestoneHoverLayerComponent);
