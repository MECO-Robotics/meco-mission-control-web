import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { bootstrap } from "@/features/workspace/shared/__tests__/taskPlanningFixture";
import type { MilestoneRecord, TaskRecord } from "@/types/recordsExecution";
import { HomeDeadlineChart } from "../HomeDeadlineChart";
import { buildHomeDeadlineModel } from "../homeDeadlineModel";

const task = (id: string, dueDate: string, status: TaskRecord["status"] = "not-started"): TaskRecord => ({
  ...bootstrap.tasks[0], id, dueDate, status,
});
const milestone = (id: string, startAt: string, status: MilestoneRecord["status"] = "planned"): MilestoneRecord => ({
  ...bootstrap.milestones[0], id, startAt, status,
});
const today = new Date(2026, 9, 20, 23, 30);

it("includes today through day 13, separating all overdue record types and excluding completed records", () => {
  const model = buildHomeDeadlineModel({ today,
    tasks: [task("past", "2026-10-19"), task("today", "2026-10-20"), task("last", "2026-11-02"),
      task("beyond", "2026-11-03"), task("complete", "2026-10-19", "complete")],
    milestones: [milestone("past", "2026-10-19T23:00:00-04:00"), milestone("last", "2026-11-02T22:00:00-05:00"),
      milestone("beyond", "2026-11-03T00:00:00Z"), milestone("complete", "2026-10-20", "complete")],
  });
  expect(model.days).toHaveLength(14);
  expect(model.days[0].key).toBe("2026-10-20");
  expect(model.days[13].key).toBe("2026-11-02");
  expect(model.days[0].tasks.map(record => record.id)).toEqual(["today"]);
  expect(model.days[13].tasks.map(record => record.id)).toEqual(["last"]);
  expect(model.days[13].milestones.map(record => record.id)).toEqual(["last"]);
  expect(model.overdue.tasks.map(record => record.id)).toEqual(["past"]);
  expect(model.overdue.milestones.map(record => record.id)).toEqual(["past"]);
  expect(model.maxTaskCount).toBe(1);
});

it("rejects invalid and rolled calendar dates instead of creating overdue records", () => {
  const invalidDates = ["", "2026-02-30", "2026-13-01", "2026-00-10", "2026-1-01", "garbage", "2026-10-20-extra"];
  const model = buildHomeDeadlineModel({ today,
    tasks: invalidDates.map((date, index) => task(String(index), date)),
    milestones: invalidDates.slice(0, -1).map((date, index) => milestone(String(index), date)),
  });
  expect(model.days.every(day => !day.tasks.length && !day.milestones.length)).toBe(true);
  expect(model.overdue.tasks).toEqual([]);
  expect(model.overdue.milestones).toEqual([]);
});

it("keeps civil dates consecutive through daylight-saving changes and month boundaries", () => {
  const model = buildHomeDeadlineModel({ today: new Date(2026, 9, 30, 23, 30), tasks: [],
    milestones: [milestone("transition", "2026-11-01T23:30:00-05:00")],
  });
  expect(model.days.map(day => day.key)).toEqual([
    "2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05",
    "2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12",
  ]);
  expect(model.days[2].milestones[0].id).toBe("transition");
});

it("retains every milestone without inflating the task scale or applying a four-record limit", () => {
  const milestones = Array.from({ length: 7 }, (_, index) => milestone(String(index), "2026-10-20T12:00:00Z"));
  const model = buildHomeDeadlineModel({ today, tasks: [], milestones });
  expect(model.days[0].milestones).toEqual(milestones);
  expect(model.maxTaskCount).toBe(0);
  const html = renderToStaticMarkup(createElement(HomeDeadlineChart, { model, onSelect: jest.fn() }));
  expect(html).toContain('aria-label="2026-10-20: 0 tasks, 7 milestones"');
  expect(html).toContain("◆ 7");
  expect(html).not.toContain("No unfinished tasks or milestones");
});

it("keeps all dates operable and labels both overdue counts when the upcoming horizon is empty", () => {
  const model = buildHomeDeadlineModel({ today, tasks: [task("past", "2026-10-19")],
    milestones: [milestone("past", "2026-10-19T12:00:00Z")],
  });
  const html = renderToStaticMarkup(createElement(HomeDeadlineChart, { model, onSelect: jest.fn() }));
  expect(html.match(/<button/g)).toHaveLength(15);
  expect(html).not.toContain("disabled");
  expect(html).toContain('aria-label="Overdue: 1 task, 1 milestone"');
  expect(html).toContain('aria-label="2026-11-02: 0 tasks, 0 milestones"');
  expect(html).toContain("No unfinished tasks or milestones are dated in the next 14 days.");
});
