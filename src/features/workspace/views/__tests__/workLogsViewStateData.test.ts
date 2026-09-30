import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import type { BootstrapPayload } from "@/types/bootstrap";
import { buildTaskById, buildWorkLogsSummaryState, filterAndSortWorkLogs, filterSummaryWorkLogs } from "@/features/workspace/views/workLogs/workLogsViewStateData";

it("keeps subsystem filtering out of the summary work-log set", () => {
  const bootstrap = createBootstrap();
  const task = bootstrap.tasks[0];
  const otherTask = { ...task, id: "task-2", subsystemIds: ["subsystem-other"] };
  const taskById = buildTaskById([task, otherTask]);
  const workLogs: BootstrapPayload["workLogs"] = [
    { date: "2026-05-02", hours: 2, id: "log-1", notes: "Drive work", participantIds: [], taskId: task.id },
    { date: "2026-05-01", hours: 1, id: "log-2", notes: "Other work", participantIds: [], taskId: otherTask.id },
  ];
  const summaryWorkLogs = filterSummaryWorkLogs(workLogs, [], "", {}, {}, taskById);
  const visibleWorkLogs = filterAndSortWorkLogs({
    sortMode: "recent",
    subsystemFilter: ["subsystem-core"],
    taskById,
    workLogs: summaryWorkLogs,
  });

  expect(summaryWorkLogs).toHaveLength(2);
  expect(visibleWorkLogs.map((workLog) => workLog.id)).toEqual(["log-1"]);
});

it("keeps the live summary metrics scoped to a person-filtered task pool", () => {
  const bootstrap = createBootstrap();
  const task = { ...bootstrap.tasks[0], estimatedHours: 5 };
  const unrelatedTask = { ...task, estimatedHours: 100, id: "task-unrelated" };
  const summary = buildWorkLogsSummaryState({
    activePersonFilter: ["student-1"],
    bootstrap: { ...bootstrap, tasks: [task, unrelatedTask] },
    summaryWorkLogs: [
      {
        date: "2026-05-02",
        hours: 2,
        id: "log-1",
        notes: "Shared work",
        participantIds: ["student-1", "student-2"],
        taskId: task.id,
      },
    ],
  });

  expect(summary).toEqual({
    activeContributorCount: 2,
    loggedHours: 2,
    remainingHours: 3,
    totalLogs: 1,
  });
});
