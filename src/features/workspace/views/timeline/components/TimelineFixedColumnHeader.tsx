import type React from "react";

import { IconEye } from "@/components/shared/Icons";

interface TimelineFixedColumnHeaderProps {
  gridColumn: string | number;
  isVisible: boolean;
  label: string;
  left: number;
  onToggle: () => void;
  width: number;
  zIndex: number;
}

export function TimelineFixedColumnHeader({
  gridColumn,
  isVisible,
  label,
  left,
  onToggle,
  width,
  zIndex,
}: TimelineFixedColumnHeaderProps) {
  return (
    <button
      aria-label={`${isVisible ? "Hide" : "Show"} ${label.toLowerCase()} column`}
      aria-pressed={isVisible}
      className={`sticky-label timeline-column-header timeline-column-header-button timeline-column-motion${isVisible ? "" : " is-hidden"}`}
      onClick={onToggle}
      title={`${isVisible ? "Hide" : "Show"} ${label.toLowerCase()} column`}
      style={{
        gridRow: isVisible ? "1 / span 2" : "1",
        gridColumn,
        width: `${width}px`,
        minWidth: `${width}px`,
        maxWidth: `${width}px`,
        padding: isVisible ? "10px 12px" : "4px",
        fontWeight: "bold",
        borderRight: "1px solid var(--border-base)",
        borderBottom: "1px solid var(--border-base)",
        display: "flex",
        alignItems: "center",
        justifyContent: isVisible ? "space-between" : "center",
        gap: "0.3rem",
        boxSizing: "border-box",
        height: "100%",
        position: "sticky",
        left: `${left}px`,
        zIndex,
        background: "var(--bg-panel)",
      } as React.CSSProperties}
      type="button"
    >
      {isVisible ? <span className="timeline-column-header-label">{label}</span> : null}
      <span
        aria-hidden="true"
        className={`timeline-column-visibility-icon${isVisible ? " is-active" : ""}`}
      >
        <IconEye />
      </span>
    </button>
  );
}
