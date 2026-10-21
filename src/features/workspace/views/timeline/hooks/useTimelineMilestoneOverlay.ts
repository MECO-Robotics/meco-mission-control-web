import type { BootstrapPayload } from "@/types/bootstrap";
import { useTimelineMilestoneOverlayLayout } from "./useTimelineMilestoneOverlayLayout";
import { useTimelineMilestoneOverlaySync } from "./useTimelineMilestoneOverlaySync";
export function useTimelineMilestoneOverlay({ days, milestones }: {
  days: string[];
  milestones: BootstrapPayload["milestones"];
}) {
  const sync = useTimelineMilestoneOverlaySync({ days });
  const layout = useTimelineMilestoneOverlayLayout({
    days, milestones,
    timelineDayCellLayouts: sync.timelineDayCellLayouts,
    timelineDayCellRefs: sync.timelineDayCellRefs,
    timelineGridHeight: sync.timelineGridHeight,
    timelineGridRef: sync.timelineGridRef,
    timelineHeaderHeight: sync.timelineHeaderHeight,
    timelineShellRef: sync.timelineShellRef,
  });
  return { ...sync, timelineDayMilestoneUnderlays: layout.timelineDayMilestoneUnderlays };
}
