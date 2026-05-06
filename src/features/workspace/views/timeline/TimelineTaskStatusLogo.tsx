import React from "react";
import type { TaskStatus } from "@/types/common";
import type { TimelineTaskStatusSignal } from "./timelineGridBodyUtils";

interface TimelineTaskStatusLogoProps {
  compact?: boolean;
  signal: TimelineTaskStatusSignal;
  status: TaskStatus;
}

const statusSignalLabels: Record<TimelineTaskStatusSignal, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  "waiting-for-qa": "Waiting for QA",
  complete: "Complete",
  blocked: "Blocked",
  "waiting-on-dependency": "Waiting on Dependency",
};

function renderStatusGlyph(signal: TimelineTaskStatusSignal) {
  switch (signal) {
    case "not-started":
      return (
        <svg aria-hidden="true" viewBox="0 0 12 12">
          <circle cx="6" cy="6" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "in-progress":
      return (
        <svg aria-hidden="true" viewBox="0 0 12 12">
          <circle cx="6" cy="6" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M6 2.5a3.5 3.5 0 0 0 0 7Z" fill="currentColor" />
        </svg>
      );
    case "waiting-for-qa":
      return (
        <svg aria-hidden="true" viewBox="0 0 12 12">
          <path
            d="M3.2 3.1h5.6v6.8H3.2Z"
            fill="none"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.1"
          />
          <path d="M4.5 2.1h3v1.8h-3Z" fill="currentColor" />
          <path d="M4.7 5.7h2.6M4.7 7.5h2.1" stroke="currentColor" strokeLinecap="round" strokeWidth="0.8" />
        </svg>
      );
    case "complete":
      return (
        <svg aria-hidden="true" viewBox="0 0 12 12">
          <circle cx="6" cy="6" r="4.1" fill="currentColor" />
          <path
            d="M3.7 6.2 5.3 7.7 8.5 4.4"
            fill="none"
            stroke="var(--timeline-task-status-logo-background)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      );
    case "blocked":
      return (
        <svg aria-hidden="true" viewBox="0 0 12 12">
          <path d="M3.2 2.2v7.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
          <path
            d="M3.8 2.6h4.8L7.7 4l0.9 1.4H3.8Z"
            fill="currentColor"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="0.7"
          />
        </svg>
      );
    case "waiting-on-dependency":
      return (
        <svg aria-hidden="true" viewBox="0 0 12 12">
          <path
            d="M3.4 2.2h5.2M3.4 9.8h5.2M4 2.8c0 1.5.8 2.2 2 3.2-1.2 1-2 1.7-2 3.2M8 2.8c0 1.5-.8 2.2-2 3.2 1.2 1 2 1.7 2 3.2"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.1"
          />
        </svg>
      );
  }
}

export const getTimelineTaskStatusLabel = (signal: TimelineTaskStatusSignal) =>
  statusSignalLabels[signal] ?? signal;

export const TimelineTaskStatusLogo: React.FC<TimelineTaskStatusLogoProps> = ({
  compact = false,
  signal,
  status,
}) => (
  <span
    aria-hidden="true"
    className={`timeline-task-status-logo timeline-task-status-logo-${status} timeline-task-status-logo-signal-${signal}${compact ? " is-compact" : ""}`}
  >
    {renderStatusGlyph(signal)}
  </span>
);
