import React from "react";
import { TimelineCollapseArrow } from "../TimelineCollapseArrow";
import { TimelineMergedCellColumn } from "./TimelineMergedCellColumn";
import { buildTimelineSubsystemHighlightStyle } from "../timelineTaskColors";
import { type TimelineSubsystemRow } from "../timelineViewModel";

interface TimelineSubsystemHeaderCellProps {
  accentColor: string;
  collapsed: boolean;
  canToggleSubsystem: boolean;
  isSubsystemHovered: boolean;
  isSubsystemSelected: boolean;
  onHover: () => void;
  onHoverLeave: () => void;
  onSelect: () => void;
  rowIndex: number;
  rowBackground: string;
  subsystem: TimelineSubsystemRow;
  subsystemColumnIndex: number;
  subsystemStickyLeft: number;
  taskCount: number;
  toggleSubsystem: (id: string) => void;
}

export const TimelineSubsystemHeaderCell: React.FC<TimelineSubsystemHeaderCellProps> = ({
  accentColor,
  collapsed,
  canToggleSubsystem,
  isSubsystemHovered,
  isSubsystemSelected,
  onHover,
  onHoverLeave,
  onSelect,
  rowIndex,
  rowBackground,
  subsystem,
  subsystemColumnIndex,
  subsystemStickyLeft,
  taskCount,
  toggleSubsystem,
}) => {
  const subsystemBandFill =
    isSubsystemHovered || isSubsystemSelected
      ? `color-mix(in srgb, ${rowBackground} 86%, ${accentColor} 14%)`
      : null;
  const subsystemSurfaceBackground = subsystemBandFill ?? rowBackground;
  const subsystemSurfaceBorderRight = subsystemBandFill ? "1px solid transparent" : "1px solid var(--border-base)";

  return (
    <TimelineMergedCellColumn
      ariaPressed={isSubsystemSelected}
      background={subsystemSurfaceBackground}
      borderRight={subsystemSurfaceBorderRight}
      collapsed={collapsed}
      dataTimelineColumn="subsystem"
      flexDirection={collapsed ? "row" : "column"}
      gridColumn={`${subsystemColumnIndex}`}
      gridRow={collapsed ? `${rowIndex}` : `${rowIndex} / span ${taskCount}`}
      justifyContent={collapsed ? "flex-start" : "center"}
      left={subsystemStickyLeft}
      onClick={onSelect}
      onKeyDown={(milestone) => {
        if (milestone.key === "Enter" || milestone.key === " ") {
          milestone.preventDefault();
          onSelect();
        }
      }}
      onMouseEnter={onHover}
      onMouseLeave={onHoverLeave}
      onToggle={canToggleSubsystem ? () => toggleSubsystem(subsystem.id) : undefined}
      overflow="hidden"
      padding={collapsed ? "0 12px" : canToggleSubsystem ? "8px 10px 8px 26px" : "8px 10px"}
      role="button"
      shouldShowToggle={canToggleSubsystem}
      toggleIcon={<TimelineCollapseArrow isCollapsed={collapsed} />}
      toggleLabel={collapsed ? "Expand subsystem" : "Collapse subsystem"}
      toggleTitle={collapsed ? "Expand subsystem" : "Collapse subsystem"}
      tabIndex={0}
      zIndex={10021}
      style={buildTimelineSubsystemHighlightStyle(accentColor, {
        boxShadow: `inset 3px 0 0 ${accentColor}`,
      })}
    >
      <div className="timeline-merged-cell-text">
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            width: "100%",
            minWidth: 0,
            maxWidth: "100%",
            paddingRight: "1.45rem",
            paddingBottom: "0.7rem",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: "0.55rem",
              height: "0.55rem",
              borderRadius: "999px",
              flexShrink: 0,
              background: accentColor,
              boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.08)",
            }}
          />
          <span className="timeline-merged-cell-title timeline-ellipsis-reveal" data-full-text={subsystem.name}>
            {subsystem.name}
          </span>
        </span>
      </div>
      {!collapsed ? (
        <span className="timeline-subsystem-counter-corner">
          {subsystem.completeCount}/{subsystem.taskCount}
        </span>
      ) : null}
    </TimelineMergedCellColumn>
  );
};
