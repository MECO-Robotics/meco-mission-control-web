import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import { dateDiffInDays } from "@/lib/appUtils/common";
import type { TimelineSubsystemRow, TimelineTaskSpan } from "../timelineViewModel";

export function buildTimelineSubsystemRows({
  includeEmptySubsystems,
  projectsById,
  scopedSubsystems,
  scopedTasks,
  startDate,
  endDate,
}: {
  includeEmptySubsystems: boolean;
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
  scopedSubsystems: BootstrapPayload["subsystems"];
  scopedTasks: TaskRecord[];
  startDate: string;
  endDate: string;
}) {
  const tasksBySubsystem = new Map<string, TimelineTaskSpan[]>();

  scopedTasks.forEach((task) => {
    if (task.startDate > endDate || task.dueDate < startDate) {
      return;
    }

    const clampedStart = task.startDate < startDate ? startDate : task.startDate;
    const clampedEnd = task.dueDate > endDate ? endDate : task.dueDate;
    const projectedTask: TimelineTaskSpan = {
      ...task,
      offset: dateDiffInDays(startDate, clampedStart),
      span: Math.max(1, dateDiffInDays(clampedStart, clampedEnd) + 1),
      spillsLeft: task.startDate < startDate,
      spillsRight: task.dueDate > endDate,
    };

    const targetSubsystemIds =
      task.subsystemIds.length > 0 ? task.subsystemIds : [task.subsystemId];
    for (const subsystemId of targetSubsystemIds) {
      const existingTasks = tasksBySubsystem.get(subsystemId);
      if (existingTasks) {
        existingTasks.push(projectedTask);
      } else {
        tasksBySubsystem.set(subsystemId, [projectedTask]);
      }
    }
  });

  const subsystemRows: TimelineSubsystemRow[] = [];

  scopedSubsystems.forEach((subsystem) => {
    const subsystemTasks = tasksBySubsystem.get(subsystem.id) ?? [];
    if (!includeEmptySubsystems && subsystemTasks.length === 0) {
      return;
    }

    let completeCount = 0;
    subsystemTasks.forEach((task) => {
      if (task.status === "complete") {
        completeCount += 1;
      }
    });

    subsystemRows.push({
      id: subsystem.id,
      name: subsystem.name,
      color: subsystem.color ?? "#4F86C6",
      projectId: subsystem.projectId,
      projectName: projectsById[subsystem.projectId]?.name ?? "Unknown",
      index: subsystemRows.length,
      taskCount: subsystemTasks.length,
      completeCount,
      tasks: subsystemTasks,
    });
  });

  return subsystemRows;
}
