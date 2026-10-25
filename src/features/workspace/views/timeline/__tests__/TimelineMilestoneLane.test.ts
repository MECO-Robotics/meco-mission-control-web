import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TimelineMilestoneLane } from "../TimelineMilestoneLane";
import type { MilestoneRecord } from "@/types/recordsExecution";

const days = ["2026-04-01", "2026-04-02", "2026-04-03"];
function milestone(id: string, startAt: string, endAt: string | null = null): MilestoneRecord {
  return { id, title: id, startAt, endAt, projectIds: [], seasonId: "season", description: "", status: "planned", type: "deadline" };
}

it("shows inclusive interval overlaps and clamps markers to the visible days", () => {
  const markup = renderToStaticMarkup(React.createElement(TimelineMilestoneLane, {
    days,
    milestones: [
      milestone("starts-before", "2026-03-30", "2026-04-01"),
      milestone("ends-after", "2026-04-03", "2026-04-05"),
      milestone("same-day", "2026-04-02"),
      milestone("outside", "2026-04-04"),
    ],
    onOpenMilestone: jest.fn(),
  }));
  expect(markup).toContain("starts-before");
  expect(markup).toContain("ends-after");
  expect(markup).toContain("same-day");
  expect(markup).not.toContain("outside");
  expect(markup).toContain("grid-column:1 / 2");
  expect(markup).toContain("grid-column:3 / 4");
  expect(markup).toContain("grid-column:2 / 3");
  expect(markup).toContain("Deadline, 2026-03-30 – 2026-04-01");
});

it("renders no lane without visible milestones", () => {
  expect(TimelineMilestoneLane({ days: [], milestones: [], onOpenMilestone: jest.fn() })).toBeNull();
  expect(TimelineMilestoneLane({ days, milestones: [milestone("outside", "2026-05-01")], onOpenMilestone: jest.fn() })).toBeNull();
});

it("opens the selected marker through a native button", () => {
  const onOpenMilestone = jest.fn();
  const lane = TimelineMilestoneLane({ days, milestones: [milestone("integration", "2026-04-02")], onOpenMilestone });
  const track = lane!.props.children[1];
  const marker = track.props.children[0];
  expect(marker.type).toBe("button");
  marker.props.onClick();
  expect(onOpenMilestone).toHaveBeenCalledWith("integration");
});
