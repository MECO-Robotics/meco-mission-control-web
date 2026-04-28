import React from "react";
import { createPortal } from "react-dom";

interface TimelineRowHighlightGeometry {
  height: number;
  left: number;
  top: number;
  width: number;
}

interface TimelineRowHighlightsPortalProps {
  hoveredSubsystemId: string | null;
  hoveredTaskId: string | null;
  portalTarget: HTMLElement | null;
  resolveRowHighlightGeometry: (
    anchorKey: string,
  ) => TimelineRowHighlightGeometry | null;
  resolveTaskRowHighlightStyle: (anchorKey: string) => React.CSSProperties | null;
  selectedSubsystemId: string | null;
  selectedTaskId: string | null;
}

export const TimelineRowHighlightsPortal: React.FC<TimelineRowHighlightsPortalProps> = ({
  hoveredSubsystemId,
  hoveredTaskId,
  portalTarget,
  resolveRowHighlightGeometry,
  resolveTaskRowHighlightStyle,
  selectedSubsystemId,
  selectedTaskId,
}) => {
  if (!portalTarget) {
    return null;
  }

  const selectedAnchorKey = selectedTaskId
    ? `task:${selectedTaskId}`
    : selectedSubsystemId
      ? `subsystem:${selectedSubsystemId}`
      : null;
  const hoveredAnchorKey = hoveredTaskId
    ? `task:${hoveredTaskId}`
    : hoveredSubsystemId
      ? `subsystem:${hoveredSubsystemId}`
      : null;

  const selectedGeometry = selectedAnchorKey
    ? resolveRowHighlightGeometry(selectedAnchorKey)
    : null;
  const hoveredGeometry = hoveredAnchorKey
    ? resolveRowHighlightGeometry(hoveredAnchorKey)
    : null;
  const selectedHighlightStyle = selectedAnchorKey
    ? resolveTaskRowHighlightStyle(selectedAnchorKey)
    : null;
  const hoveredHighlightStyle = hoveredAnchorKey
    ? resolveTaskRowHighlightStyle(hoveredAnchorKey)
    : null;

  if (!selectedGeometry && !hoveredGeometry) {
    return null;
  }

  return createPortal(
    <>
      {selectedGeometry ? (
        <div
          aria-hidden="true"
          className="timeline-row-highlight is-selected"
          style={{
            ...selectedHighlightStyle,
            height: `${selectedGeometry.height}px`,
            left: `${selectedGeometry.left}px`,
            top: `${selectedGeometry.top}px`,
            width: `${selectedGeometry.width}px`,
            zIndex: 4,
          }}
        />
      ) : null}
      {hoveredGeometry ? (
        <div
          aria-hidden="true"
          className="timeline-row-highlight is-hovered"
          style={{
            ...hoveredHighlightStyle,
            height: `${hoveredGeometry.height}px`,
            left: `${hoveredGeometry.left}px`,
            top: `${hoveredGeometry.top}px`,
            width: `${hoveredGeometry.width}px`,
            zIndex: 5,
          }}
        />
      ) : null}
    </>,
    portalTarget,
  );
};
