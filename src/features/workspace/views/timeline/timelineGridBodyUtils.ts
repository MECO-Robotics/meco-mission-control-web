import type { BootstrapPayload } from "@/types";

export type TimelineTaskDependencyRecord = NonNullable<BootstrapPayload["taskDependencies"]>[number];

export function getTaskDependencyCounts(
  taskId: string,
  dependencies: TimelineTaskDependencyRecord[] = [],
) {
  let incoming = 0;
  let outgoing = 0;

  dependencies.forEach((dependency) => {
    if (dependency.downstreamTaskId === taskId) {
      incoming += 1;
    }
    if (dependency.upstreamTaskId === taskId) {
      outgoing += 1;
    }
  });

  return { incoming, outgoing };
}
