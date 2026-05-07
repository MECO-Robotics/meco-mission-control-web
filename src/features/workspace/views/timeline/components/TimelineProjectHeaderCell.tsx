import React from "react";
import { TimelineCollapseArrow } from "../TimelineCollapseArrow";
import { TimelineMergedCellColumn } from "./TimelineMergedCellColumn";
import type { TimelineProjectRow } from "../timelineViewModel";
import { getTimelineMergedCellRotation } from "../timelineViewModel";

interface TimelineProjectHeaderCellProps {
  project: TimelineProjectRow;
  projectBackground: string;
  projectCollapsed: boolean;
  projectRowCount: number;
  toggleProject: (id: string) => void;
}

export const TimelineProjectHeaderCell: React.FC<TimelineProjectHeaderCellProps> = ({
  project,
  projectBackground,
  projectCollapsed,
  projectRowCount,
  toggleProject,
}) => {
  const shouldRotateProjectLabel = !projectCollapsed && projectRowCount > 1;
  const projectLabelRotation = getTimelineMergedCellRotation(projectRowCount);

  return (
    <TimelineMergedCellColumn
      background={projectBackground}
      borderRight="1px solid var(--border-base)"
      collapsed={projectCollapsed}
      dataTimelineColumn="project"
      flexDirection={projectCollapsed ? "row" : "column"}
      gridColumn="1"
      gridRow={`1 / span ${Math.max(1, projectRowCount)}`}
      justifyContent={projectCollapsed ? "flex-start" : "center"}
      left={0}
      onToggle={() => toggleProject(project.id)}
      overflow="hidden"
      padding={projectCollapsed ? "0 12px" : "8px 10px 8px 26px"}
      shouldShowToggle
      toggleIcon={<TimelineCollapseArrow isCollapsed={projectCollapsed} />}
      toggleLabel={projectCollapsed ? "Expand project" : "Collapse project"}
      toggleTitle={projectCollapsed ? "Expand project" : "Collapse project"}
      zIndex={10022}
    >
      <div
        className={`timeline-merged-cell-text${shouldRotateProjectLabel ? " is-rotated" : ""}`}
        style={
          shouldRotateProjectLabel
            ? ({
                ["--timeline-merged-cell-rotation" as const]: projectLabelRotation,
              } as React.CSSProperties)
            : undefined
        }
      >
        <span className="timeline-merged-cell-title timeline-ellipsis-reveal" data-full-text={project.name}>
          {project.name}
        </span>
        <span className="timeline-merged-cell-meta">
          {project.completeCount}/{project.taskCount}
        </span>
      </div>
    </TimelineMergedCellColumn>
  );
};
