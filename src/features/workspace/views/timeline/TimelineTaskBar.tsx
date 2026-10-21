import React, { useId } from "react";
import { EditableHoverIndicator } from "@/features/workspace/shared/table/workspaceTableChrome";
import type { TaskRecord } from "@/types/recordsExecution";

import type { TimelineTaskStatusSignal } from "./timelineGridBodyUtils";

interface TimelineTaskBarProps {
  compact?: boolean;
  description: string;
  signal: TimelineTaskStatusSignal;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onOpenTask: (task: TaskRecord) => void;
  style: React.CSSProperties;
  task: TaskRecord;
  title: string;
  spillsLeft?: boolean;
  spillsRight?: boolean;
}

export const TimelineTaskBar: React.FC<TimelineTaskBarProps> = ({
  compact = false,
  description,
  signal,
  onMouseEnter,
  onMouseLeave,
  onOpenTask,
  style,
  task,
  title,
  spillsLeft = false,
  spillsRight = false,
}) => {
  const tooltipId = useId();
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
        aria-label={description}
        aria-describedby={tooltipId}
        data-status-signal={signal}
        onFocus={onMouseEnter}
        onBlur={onMouseLeave}
        className={`timeline-bar timeline-${signal} timeline-row-motion-item`}
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
                ["--timeline-reveal-background" as const]: "var(--timeline-task-bar-background)",
              } as React.CSSProperties}
            >
              {task.title}
            </span>
          )}
          <span id={tooltipId} className="timeline-task-bar-details" role="tooltip">{description}</span>
        </span>
      </button>
      <EditableHoverIndicator className="timeline-bar-hover-indicator editable-hover-indicator-compact" />
    </div>
  );
};
