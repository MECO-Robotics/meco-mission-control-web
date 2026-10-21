import type { BootstrapPayload } from "@/types/bootstrap";
import { isTaskDependencySatisfied } from "@/features/workspace/shared/task/taskPlanningInternals";

export interface ProductTimelineTaskLink {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
  type: "hard" | "soft";
  state: "waiting" | "satisfied" | "advisory";
}

export interface ProductTimelineBarRect {
  taskId: string;
  groupKey: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface ProductTimelineDependencyPath extends ProductTimelineTaskLink {
  key: string;
  groupKey: string;
  points: Array<{ x: number; y: number }>;
  d: string;
}

export function getProductTimelineTaskLinks(bootstrap: BootstrapPayload): ProductTimelineTaskLink[] {
  const taskIds = new Set(bootstrap.tasks.map((task) => task.id));
  return bootstrap.taskDependencies.flatMap((dependency): ProductTimelineTaskLink[] => {
    if (dependency.kind !== "task" || dependency.refId === dependency.taskId || !taskIds.has(dependency.refId) || !taskIds.has(dependency.taskId)) return [];
    return [{
      id: dependency.id,
      sourceTaskId: dependency.refId,
      targetTaskId: dependency.taskId,
      type: dependency.dependencyType,
      state: dependency.dependencyType === "soft" ? "advisory" : isTaskDependencySatisfied(dependency, bootstrap) ? "satisfied" : "waiting",
    }];
  });
}

export function buildProductTimelineDependencyPaths(links: ProductTimelineTaskLink[], bars: ProductTimelineBarRect[], width: number, height: number): ProductTimelineDependencyPath[] {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 6 || height <= 0) return [];
  const clampX = (x: number) => Math.min(width, Math.max(0, x));
  const clampY = (y: number) => Math.min(height, Math.max(0, y));
  const rendered = bars.filter((bar) => [bar.left, bar.right, bar.top, bar.bottom].every(Number.isFinite) && bar.right > bar.left && bar.bottom > bar.top && bar.right > 0 && bar.left < width && bar.bottom > 0 && bar.top < height).map((bar) => ({
    ...bar, left: clampX(bar.left), right: clampX(bar.right), top: clampY(bar.top), bottom: clampY(bar.bottom),
  }));
  const centerY = (bar: ProductTimelineBarRect) => (bar.top + bar.bottom) / 2;
  return links.flatMap((link) => {
    const sources = rendered.filter((bar) => bar.taskId === link.sourceTaskId);
    return rendered.filter((bar) => bar.taskId === link.targetTaskId).flatMap((target, targetIndex) => {
      const sameGroup = sources.filter((source) => source.groupKey === target.groupKey);
      const candidates = sameGroup.length ? sameGroup : sources;
      const source = candidates.reduce<ProductTimelineBarRect | undefined>((nearest, candidate) => !nearest || Math.abs(centerY(candidate) - centerY(target)) < Math.abs(centerY(nearest) - centerY(target)) ? candidate : nearest, undefined);
      if (!source || source.taskId === target.taskId) return [];
      const start = { x: source.right, y: centerY(source) };
      // Keep the entire arrowhead inside the track, including minimum-width bars at its left edge.
      const clippedTarget = target.left < 6;
      const verticalX = Math.max(3, Math.min(width - 3, target.left + Math.min(6, (target.right - target.left) / 2)));
      const rightEntry = clippedTarget && (verticalX < target.left || verticalX > target.right);
      if (rightEntry && width - target.right < 6) return [];
      const end = rightEntry ? { x: target.right, y: centerY(target) } : clippedTarget ? { x: verticalX, y: centerY(source) < centerY(target) ? target.top : target.bottom } : { x: target.left, y: centerY(target) };
      let points: ProductTimelineDependencyPath["points"];
      if (!clippedTarget && end.x - start.x >= 16) {
        const elbow = (start.x + end.x) / 2;
        points = [start, { x: elbow, y: start.y }, { x: elbow, y: end.y }, end];
      } else {
        const exit = clampX(start.x + 8);
        const entry = rightEntry ? clampX(end.x + 8) : clippedTarget ? end.x : clampX(end.x - 8);
        const gapY = source.bottom <= target.top ? (source.bottom + target.top) / 2 : target.bottom <= source.top ? (target.bottom + source.top) / 2 : clampY(Math.min(source.top, target.top) - 8);
        points = [start, { x: exit, y: start.y }, { x: exit, y: gapY }, { x: entry, y: gapY }, ...(clippedTarget && !rightEntry ? [] : [{ x: entry, y: end.y }]), end];
      }
      return [{ ...link, key: `${link.id}:${target.groupKey}:${targetIndex}`, groupKey: target.groupKey, points, d: points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ") }];
    });
  });
}
