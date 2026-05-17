import { useEffect, useRef } from "react";
import type { CSSProperties, Dispatch, SetStateAction } from "react";

import { KanbanScrollFrame } from "@/features/workspace/views/kanban/KanbanScrollFrame";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneRecord } from "@/types/recordsExecution";

import { MilestoneKanbanBoard } from "../MilestoneKanbanBoard";
import { clampMilestoneZoom, MILESTONE_ZOOM_STEP } from "../milestonesViewUtils";

interface MilestonesBoardSectionProps {
  bootstrap: BootstrapPayload;
  milestones: MilestoneRecord[];
  milestoneZoom: number;
  motionClassName: string;
  onOpenMilestone: (milestone: MilestoneRecord) => void;
  projectLabelByMilestoneId: Record<string, string>;
  searchFilter: string;
  setMilestoneZoom: Dispatch<SetStateAction<number>>;
}

export function MilestonesBoardSection({
  bootstrap,
  milestones,
  milestoneZoom,
  motionClassName,
  onOpenMilestone,
  projectLabelByMilestoneId,
  searchFilter,
  setMilestoneZoom,
}: MilestonesBoardSectionProps) {
  const zoomShellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shell = zoomShellRef.current;
    if (!shell) {
      return;
    }

    const handleWheel = (milestone: WheelEvent) => {
      if (!(milestone.ctrlKey || milestone.metaKey) || milestone.deltaY === 0) {
        return;
      }

      milestone.preventDefault();
      setMilestoneZoom((current) =>
        clampMilestoneZoom(current + (milestone.deltaY > 0 ? -1 : 1) * MILESTONE_ZOOM_STEP),
      );
    };

    const gestureScale = { current: 1 };

    const handleGestureStart = (milestone: Event) => {
      milestone.preventDefault();
      const gesture = milestone as Event & { scale?: number };
      gestureScale.current = gesture.scale ?? 1;
    };

    const handleGestureChange = (milestone: Event) => {
      milestone.preventDefault();
      const gesture = milestone as Event & { scale?: number };
      const nextScale = gesture.scale ?? 1;
      if (Math.abs(nextScale - gestureScale.current) < 0.08) {
        return;
      }

      setMilestoneZoom((current) =>
        clampMilestoneZoom(current + (nextScale > gestureScale.current ? 1 : -1) * MILESTONE_ZOOM_STEP),
      );
      gestureScale.current = nextScale;
    };

    shell.addEventListener("wheel", handleWheel, { passive: false });
    shell.addEventListener("gesturestart", handleGestureStart, { passive: false } as AddEventListenerOptions);
    shell.addEventListener("gesturechange", handleGestureChange, { passive: false } as AddEventListenerOptions);

    return () => {
      shell.removeEventListener("wheel", handleWheel);
      shell.removeEventListener("gesturestart", handleGestureStart);
      shell.removeEventListener("gesturechange", handleGestureChange);
    };
  }, [setMilestoneZoom]);

  const boardStyle = {
    "--task-queue-zoom": milestoneZoom,
    "--task-queue-board-column-width": `calc(15.5rem * ${milestoneZoom})`,
  } as CSSProperties;

  return milestones.length > 0 ? (
    <div className="milestones-board-section" ref={zoomShellRef}>
      <KanbanScrollFrame motionClassName={motionClassName}>
        <>
          <MilestoneKanbanBoard
            boardStyle={boardStyle}
            bootstrap={bootstrap}
            milestones={milestones}
            onOpenMilestone={onOpenMilestone}
            projectLabelByMilestoneId={projectLabelByMilestoneId}
            searchFilter={searchFilter}
          />
          <div className="task-queue-board-footer">
            <p className="task-queue-board-load-status">
              {milestones.length === 1
                ? "Showing 1 milestone."
                : `Showing ${milestones.length} milestones.`}
            </p>
          </div>
        </>
      </KanbanScrollFrame>
    </div>
  ) : (
    <p className="empty-state">No milestones match the current filters.</p>
  );
}
