/// <reference types="jest" />

import { countStaleTasks } from "../riskViewTaskFreshness";

describe("risk view task freshness", () => {
  it("counts old and unavailable active tasks but ignores completed tasks", () => {
    const now = Date.UTC(2026, 4, 21);

    expect(countStaleTasks({
      tasks: [
        { id: "stale", status: "in-progress" },
        { id: "recent", status: "not-started" },
        { id: "unknown", status: "not-started" },
        { id: "complete", status: "complete" },
      ],
      lastActivityByTaskId: new Map([
        ["stale", now - 10 * 24 * 60 * 60 * 1000],
        ["recent", now - 2 * 24 * 60 * 60 * 1000],
      ]),
      nowTimestamp: now,
      thresholdDays: 5,
    })).toEqual({ staleCount: 1, unavailableCount: 1 });
  });
});
