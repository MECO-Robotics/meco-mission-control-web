/// <reference types="jest" />

import {
  getTimelineTaskStatusSignal,
} from "@/features/workspace/views/timeline/timelineGridBodyUtils";
import type { BootstrapPayload } from "@/types/bootstrap";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";

const baseTask: BootstrapPayload["tasks"][number] = {
  id: "task-ready",
  projectId: "project-1",
  workstreamIds: [],
  title: "Ready task",
  summary: "",
  subsystemIds: ["subsystem-1"],
  workTypeId: "work-type-design",
  responsibleGroupId: null,
  mechanismIds: [],
  partInstanceIds: [],
  scheduleRefs: [],
  requestedById: null,
  checklistItems: [],
  manufacturingDetails: null,
  ownerId: "member-1",
  assigneeIds: ["member-1"],
  mentorId: null,
  startDate: "2026-04-01",
  dueDate: "2026-04-03",
  priority: "medium",
  status: "not-started",

  estimatedHours: 1,
  actualHours: 0,
  requiresDocumentation: false,
};

describe("timeline task dependency counts and status", () => {
  it("prioritizes active blockers over dependency and status icons", () => {
    const bootstrap: BootstrapPayload = {
      ...EMPTY_BOOTSTRAP,
      tasks: [
        { ...baseTask, id: "task-upstream", status: "in-progress" },
        { ...baseTask, id: "task-blocked" },
        { ...baseTask, id: "task-waiting" },
        { ...baseTask, id: "task-qa", status: "waiting-for-qa" },
      ],
      taskDependencies: [
        {
          id: "dependency-1",
          taskId: "task-waiting",
          kind: "task",
          refId: "task-upstream",
          dependencyType: "hard",
          createdAt: "2026-02-01T00:00:00.000Z",
          requiredState: "complete",
        },
      ],
      risks: [
        {
          id: "risk-1",
          projectId: "project-1",
          title: "Waiting on material",
          detail: "Material unavailable",
          category: "inventory",
          severity: "medium",
          status: "open",
          blocksWork: true,
          source: { kind: "manual" },
          relatedTargets: [{ kind: "task", id: "task-blocked" }],
          mitigationTaskId: null,
          ownerGroupId: null,
        ownerMemberId: null,
        mitigationDueDate: null,
          createdAt: "2026-02-01T00:00:00.000Z",
          updatedAt: "2026-02-01T00:00:00.000Z",
          resolvedAt: null,
        },
      ],
    };

    const signals = Object.fromEntries(bootstrap.tasks.map((task) => [task.id, getTimelineTaskStatusSignal(task, bootstrap)]));

    expect(signals["task-upstream"]).toBe("in-progress");
    expect(signals["task-blocked"]).toBe("blocked");
    expect(signals["task-waiting"]).toBe("waiting-on-dependency");
    expect(signals["task-qa"]).toBe("waiting-for-qa");
    expect(getTimelineTaskStatusSignal(bootstrap.tasks[1], bootstrap)).toBe("blocked");
  });
});
