import type { BootstrapPayload } from "@/types/bootstrap";
import { toAgeDays } from "./riskViewMetricsUtils";

export function countStaleTasks(args: {
  tasks: Array<Pick<BootstrapPayload["tasks"][number], "id" | "status">>;
  lastActivityByTaskId: ReadonlyMap<string, number>;
  nowTimestamp: number;
  thresholdDays: number;
}) {
  // Task records have no updatedAt yet, so activity timestamps are the best available signal.
  let unavailableCount = 0;
  const staleCount = args.tasks.filter((task) => task.status !== "complete").reduce((count, task) => {
    const lastActivity = args.lastActivityByTaskId.get(task.id);
    if (lastActivity === undefined) {
      unavailableCount += 1;
      return count;
    }

    return toAgeDays(lastActivity, args.nowTimestamp) >= args.thresholdDays ? count + 1 : count;
  }, 0);

  return { staleCount, unavailableCount };
}
