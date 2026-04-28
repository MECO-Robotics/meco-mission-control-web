import React from "react";

interface TimelineCollapseArrowProps {
  isCollapsed: boolean;
}

export const TimelineCollapseArrow: React.FC<TimelineCollapseArrowProps> = ({ isCollapsed }) => (
  <span
    aria-hidden="true"
    className={`timeline-collapse-arrow${isCollapsed ? " is-collapsed" : ""}`}
  />
);
