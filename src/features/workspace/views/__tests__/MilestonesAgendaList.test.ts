/// <reference types="jest" />
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MilestonesAgendaList } from "../milestones/MilestonesAgendaList";
import type { MilestoneRecord } from "@/types/recordsExecution";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
const milestone: MilestoneRecord = {
  id: "review",
  seasonId: "season-1",
  title: "Intake review",
  type: "deadline",
  status: "planned",
  readinessStatus: "blocked",
  startAt: "2026-09-10T14:00:00Z",
  endAt: null,
  description: "Review intake tests",
  projectIds: ["robot"],
};
it("shows readiness, date, type, project and accessible milestone action together", () => {
  const markup = renderToStaticMarkup(React.createElement(MilestonesAgendaList, { milestones: [milestone], onOpenMilestone: jest.fn(), projectLabelByMilestoneId: { review: "Competition robot" } }));
  expect(markup).toContain("Intake review</button>");
  expect(markup).toContain("Planned");
  expect(markup).toContain("Blocked");
  expect(markup).toContain("Deadline");
  expect(markup).toContain("Competition robot");
  expect(markup).toContain('dateTime="2026-09-10T14:00:00Z"');
});
it("explains an empty filtered agenda", () => {
  const markup = renderToStaticMarkup(React.createElement(MilestonesAgendaList, { milestones: [], onOpenMilestone: jest.fn(), projectLabelByMilestoneId: {} }));
  expect(markup).toContain("No milestones match these filters.");
});
