import React from "react";
import { EditableHoverIndicator } from "@/features/workspace/shared/table/workspaceTableChrome";
import type { TaskRecord } from "@/types/recordsExecution";
import type {
  TimelineTaskDependencyCounts,
} from "./timelineGridBodyUtils";

type TimelineTaskDependencyPresentation = "none" | "outline" | "text";

interface TimelineTaskBarProps {
  compact?: boolean;
  dependencyCounts: TimelineTaskDependencyCounts;
  dependencyPresentation?: TimelineTaskDependencyPresentation;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onOpenTask: (task: TaskRecord) => void;
  style: React.CSSProperties;
  task: TaskRecord;
  title: string;
  spillsLeft?: boolean;
  spillsRight?: boolean;
}

function hasTaskDependencies(counts: TimelineTaskDependencyCounts) {
  return counts.incoming > 0 || counts.outgoing > 0;
}

function renderDependencyIndicator(
  counts: TimelineTaskDependencyCounts,
  presentation: TimelineTaskDependencyPresentation,
) {
  if (!hasTaskDependencies(counts) || presentation === "none") {
    return null;
  }

  if (presentation === "outline") {
    return (
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          border: "1px solid rgba(255, 255, 255, 0.3)",
          borderRadius: "inherit",
          pointerEvents: "none",
          opacity: 0.75,
        }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{
        marginLeft: "8px",
        fontSize: "0.65rem",
        opacity: 0.8,
        whiteSpace: "nowrap",
      }}
    >
      {counts.incoming > 0 ? `\u2199 ${counts.incoming}` : ""}
      {counts.incoming > 0 && counts.outgoing > 0 ? " " : ""}
      {counts.outgoing > 0 ? `\u2197 ${counts.outgoing}` : ""}
    </span>
  );
}

export const TimelineTaskBar: React.FC<TimelineTaskBarProps> = ({
  compact = false,
  dependencyCounts,
  dependencyPresentation = "none",
  onMouseEnter,
  onMouseLeave,
  onOpenTask,
  style,
  task,
  title,
  spillsLeft = false,
  spillsRight = false,
}) => {
  const { borderRadius, ...baseStyle } = style;
  const spillAwareStyle: React.CSSProperties = {
    ...baseStyle,
    overflow: "visible",
    ...(borderRadius
      ? ({
          "--timeline-task-bar-radius": borderRadius,
        } as React.CSSProperties)
      : null),
    ...(spillsLeft ? { marginLeft: 0 } : null),
    ...(spillsRight
      ? {
          marginRight: 0,
        }
      : null),
  };

  const {
    gridRow,
    gridColumn,
    margin,
    alignSelf,
    marginLeft,
    marginRight,
    ...buttonStyle
  } = spillAwareStyle;

  const hostStyle: React.CSSProperties = {
    position: "relative",
    overflow: "visible",
    width: "100%",
    gridRow,
    gridColumn,
    margin,
    boxSizing: "border-box",
    paddingLeft: marginLeft ?? "var(--timeline-task-bar-edge-gap, 2px)",
    paddingRight: marginRight ?? "var(--timeline-task-bar-edge-gap, 2px)",
    alignSelf,
  };

  return (
      <div
        className="timeline-bar-hover-host editable-hover-target"
        data-timeline-column="task"
        data-tutorial-target="timeline-task-bar"
        data-spill-left={spillsLeft ? "true" : undefined}
        data-spill-right={spillsRight ? "true" : undefined}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      style={hostStyle}
      >
      <button
        className={`timeline-bar timeline-${task.status} timeline-row-motion-item`}
        data-spill-left={spillsLeft ? "true" : undefined}
        data-spill-right={spillsRight ? "true" : undefined}
        onClick={() => onOpenTask(task)}
        style={{
          ...buttonStyle,
          gridRow,
          gridColumn,
        }}
        title={title}
        type="button"
      >
        <span className="timeline-bar-content">
          {compact ? null : (
            <span
              className="timeline-bar-title timeline-ellipsis-reveal"
              data-full-text={task.title}
              style={{
                ["--timeline-reveal-background" as const]: "var(--timeline-task-discipline-accent)",
              } as React.CSSProperties}
            >
              {task.title}
            </span>
          )}
          {renderDependencyIndicator(dependencyCounts, dependencyPresentation)}
        </span>
      </button>
      <EditableHoverIndicator className="timeline-bar-hover-indicator editable-hover-indicator-compact" />
    </div>
  );
};
