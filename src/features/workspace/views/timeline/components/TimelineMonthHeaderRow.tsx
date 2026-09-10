import type React from "react";

import type { TimelineMonthHeaderCell } from "../model/timelineGridHeaderData";

interface TimelineMonthHeaderRowProps {
  cells: TimelineMonthHeaderCell[];
}

export function TimelineMonthHeaderRow({ cells }: TimelineMonthHeaderRowProps) {
  return (
    <>
      {cells.map((group, index) => (
        <div
          key={`month-${index}`}
          style={{
            gridRow: "1",
            gridColumn: `${group.startColumn} / span ${group.span}`,
            textAlign: "center",
            fontSize: "10px",
            fontWeight: "bold",
            padding: "6px 0",
            borderBottom: "1px solid var(--border-base)",
            borderRight: "1px solid var(--border-base)",
            textTransform: "uppercase",
            color: "var(--meco-blue)",
            background: "var(--bg-row-alt)",
            position: "sticky",
            top: 0,
            zIndex: 12,
            boxSizing: "border-box",
          } as React.CSSProperties}
        >
          {group.month}
        </div>
      ))}
    </>
  );
}
