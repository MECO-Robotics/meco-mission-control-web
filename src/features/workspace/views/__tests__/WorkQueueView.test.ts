/// <reference types="jest" />
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { WorkQueueView } from "@/features/workspace/views/work/WorkQueueView";

describe("WorkQueueView", () => {
  it("renders canonical WorkItems from both sources with manufacturing metadata", () => {
    const bootstrap = {
      ...createBootstrap(),
      workItems: [
        { id: "task:task-1", sourceType: "task" as const, sourceId: "task-1", taskId: "task-1", title: "Design intake", workType: "Design" as const, responsibleGroup: "Mechanical" as const, manufacturingProcess: null, subsystemId: "subsystem-1", dueDate: "2026-10-01", status: "not-started", quantity: null, material: null, materialId: null, partDefinitionId: null, partInstanceIds: [], batchLabel: null, mentorReviewed: null },
        { id: "manufacturing:job-1", sourceType: "manufacturing" as const, sourceId: "job-1", taskId: null, title: "Print intake", workType: "Manufacturing" as const, responsibleGroup: "Mechanical" as const, manufacturingProcess: "3d-print" as const, subsystemId: "subsystem-1", dueDate: "2026-10-02", status: "requested", quantity: 4, material: "PLA", materialId: "material-1", partDefinitionId: "part-1", partInstanceIds: ["instance-1"], batchLabel: "Batch A", mentorReviewed: false },
      ],
      tasks: [{ ...createBootstrap().tasks[0], id: "task-1", title: "Design intake" }],
      manufacturingItems: [{ id: "job-1", title: "Print intake", subsystemId: "subsystem-1", requestedById: null, process: "3d-print" as const, dueDate: "2026-10-02", material: "PLA", materialId: "material-1", partDefinitionId: "part-1", partInstanceId: "instance-1", partInstanceIds: ["instance-1"], quantity: 4, status: "requested" as const, mentorReviewed: false, inHouse: false, batchLabel: "Batch A" }],
    };
    const markup = renderToStaticMarkup(React.createElement(WorkQueueView, {
      bootstrap,
      onCreateManufacturing: () => undefined,
      onCreateTask: () => undefined,
      onEditManufacturing: () => undefined,
      onEditTask: () => undefined,
    }));
    expect(markup).toContain("Design intake");
    expect(markup).toContain("Print intake");
    expect(markup).toContain("PLA");
    expect(markup).toContain("Batch A");
    expect(markup).toContain("Mentor review pending");
    expect(markup).toContain("3d-print");
  });
});
