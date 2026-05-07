import React from "react";

interface TimelineMergedCellColumnProps {
  ariaPressed?: boolean;
  background: string;
  borderRight: string;
  children: React.ReactNode;
  className?: string;
  collapsed: boolean;
  dataTimelineColumn?: string;
  flexDirection: "row" | "column";
  gridColumn: string | number;
  gridRow: string;
  justifyContent: "flex-start" | "center";
  left: number;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
  onToggle?: () => void;
  padding: string;
  role?: string;
  shouldShowToggle: boolean;
  toggleIcon?: React.ReactNode;
  toggleLabel: string;
  toggleTitle: string;
  tabIndex?: number;
  zIndex: number;
  overflow?: "visible" | "hidden";
  style?: React.CSSProperties;
}

export const TimelineMergedCellColumn: React.FC<TimelineMergedCellColumnProps> = ({
  ariaPressed,
  background,
  borderRight,
  children,
  className = "timeline-merged-cell-column timeline-column-motion timeline-row-motion-item",
  collapsed,
  dataTimelineColumn,
  flexDirection,
  gridColumn,
  gridRow,
  justifyContent,
  left,
  onClick,
  onKeyDown,
  onMouseEnter,
  onMouseLeave,
  onToggle,
  padding,
  role,
  tabIndex,
  shouldShowToggle,
  toggleIcon,
  toggleLabel,
  toggleTitle,
  zIndex,
  overflow = "visible",
  style,
}) => (
  <div
    aria-pressed={ariaPressed}
    className={className}
    data-timeline-column={dataTimelineColumn}
    onClick={onClick}
    onKeyDown={onKeyDown}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    role={role}
    tabIndex={tabIndex}
    style={{
      gridRow,
      gridColumn,
      position: "sticky",
      left,
      zIndex,
      background,
      borderRight,
      ...style,
      display: "flex",
      flexDirection,
      justifyContent,
      alignItems: "center",
      minHeight: "38px",
      padding,
      overflow,
      boxSizing: "border-box",
    }}
  >
    {shouldShowToggle && onToggle ? (
      <button
        aria-label={toggleLabel}
        className="subsystem-toggle"
        onClick={onToggle}
        title={toggleTitle}
        type="button"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px",
          fontSize: "12px",
          color: "var(--text-copy)",
          marginRight: collapsed ? "6px" : 0,
          position: collapsed ? "static" : "absolute",
          top: collapsed ? undefined : "4px",
          left: collapsed ? undefined : "6px",
          zIndex: 1,
          flexShrink: 0,
        }}
      >
        {toggleIcon}
      </button>
    ) : null}
    {children}
  </div>
);
