import React from "react";
import type { TaskStatus } from "@/types";

interface TimelineTaskStatusLogoProps {
  compact?: boolean;
  status: TaskStatus;
}

function renderStatusGlyph(status: TaskStatus) {
  switch (status) {
    case "not-started":
      return (
        <svg aria-hidden="true" viewBox="0 0 12 12">
          <circle cx="6" cy="6" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "in-progress":
      return (
        <svg aria-hidden="true" viewBox="0 0 12 12">
          <path d="M4 3.2 8.6 6 4 8.8Z" fill="currentColor" />
        </svg>
      );
    case "waiting-for-qa":
      return (
        <svg aria-hidden="true" viewBox="0 0 12 12">
          <path d="M6 2.2 9.8 6 6 9.8 2.2 6Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="6" cy="6" r="1.1" fill="currentColor" />
        </svg>
      );
    case "complete":
      return (
        <svg aria-hidden="true" viewBox="0 0 12 12">
          <path
            d="M2.4 6.3 4.9 8.6 9.5 3.9"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
        </svg>
      );
  }
}

export const TimelineTaskStatusLogo: React.FC<TimelineTaskStatusLogoProps> = ({
  compact = false,
  status,
}) => (
  <span
    aria-hidden="true"
    className={`timeline-task-status-logo timeline-task-status-logo-${status}${compact ? " is-compact" : ""}`}
  >
    {renderStatusGlyph(status)}
  </span>
);
