/// <reference types="jest" />

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared";
import type { BootstrapPayload, TaskRecord } from "@/types";

function createBootstrap(): BootstrapPayload {
  return {
    ...EMPTY_BOOTSTRAP,
    seasons: [
      {
        id: "season-1",
        name: "2026",
        type: "season",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      },
    ],
    projects: [
      {
        id: "project-1",
        seasonId: "season-1",
        name: "Robot",
        projectType: "robot",
        description: "",
        status: "active",
      },
    ],
    members: [
      {
        id: "member-1",
        name: "Ada",
        email: "ada@example.com",
        role: "lead",
        elevated: true,
        seasonId: "season-1",
      },
    ],
    subsystems: [
      {
        id: "subsystem-1",
        projectId: "project-1",
        name: "Drivebase",
        description: "",
        iteration: 1,
        isCore: true,
        parentSubsystemId: null,
        responsibleEngineerId: "member-1",
        mentorIds: [],
        risks: [],
      },
    ],
    disciplines: [
      {
        id: "discipline-1",
        code: "design",
        name: "Design",
      },
    ],
    tasks: [
      {
        id: "task-1",
        projectId: "project-1",
        workstreamId: null,
        workstreamIds: [],
        title: "Frame rail layout",
        summary: "",
        subsystemId: "subsystem-1",
        subsystemIds: ["subsystem-1"],
        disciplineId: "discipline-1",
        mechanismId: null,
        mechanismIds: [],
        partInstanceId: null,
        partInstanceIds: [],
        targetEventId: null,
        ownerId: "member-1",
        assigneeIds: ["member-1"],
        mentorId: null,
        startDate: "2026-04-06",
        dueDate: "2026-04-10",
        priority: "high",
        status: "in-progress",
        dependencyIds: [],
        blockers: [],
        linkedManufacturingIds: [],
        linkedPurchaseIds: [],
        estimatedHours: 4,
        actualHours: 1,
        requiresDocumentation: false,
        documentationLinked: false,
      },
    ],
  };
}

const membersById = {
  "member-1": {
    id: "member-1",
    name: "Ada",
    email: "ada@example.com",
    role: "lead" as const,
    elevated: true,
    seasonId: "season-1",
  },
};

describe("TimelineView interactions", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("forwards timeline task clicks to the task details modal opener", () => {
    const bootstrap = createBootstrap();
    const openTaskDetailModal = jest.fn();
    let capturedOpenTaskDetailModal: ((task: TaskRecord) => void) | null = null;

    jest.isolateModules(() => {
      const React = require("react");
      const { renderToStaticMarkup } = require("react-dom/server");

      (globalThis as typeof globalThis & { React: typeof React }).React = React;

      jest.doMock("@/features/workspace/views/timeline/TimelineGridBody", () => ({
        TimelineGridBody: ({
          openTaskDetailModal: forwardedOpenTaskDetailModal,
        }: {
          openTaskDetailModal: (task: TaskRecord) => void;
        }) => {
          capturedOpenTaskDetailModal = forwardedOpenTaskDetailModal;
          return React.createElement("div");
        },
      }));

      const { TimelineView } = require("@/features/workspace/views/timeline/TimelineView");

      renderToStaticMarkup(
        React.createElement(TimelineView, {
          bootstrap,
          isAllProjectsView: false,
          activePersonFilter: [],
          setActivePersonFilter: jest.fn(),
          membersById,
          openTaskDetailModal,
          openCreateTaskModal: jest.fn(),
          onDeleteTimelineEvent: jest.fn(),
          onSaveTimelineEvent: jest.fn(),
          triggerCreateMilestoneToken: 0,
        }),
      );
    });

    expect(capturedOpenTaskDetailModal).not.toBeNull();

    capturedOpenTaskDetailModal?.(bootstrap.tasks[0]);

    expect(openTaskDetailModal).toHaveBeenCalledTimes(1);
    expect(openTaskDetailModal).toHaveBeenCalledWith(bootstrap.tasks[0]);
  });

  it("limits timeline detail opening to the task label and task bar, not the row background", () => {
    const projectGroupSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineProjectGroup.tsx"),
      "utf8",
    );
    const subsystemGroupSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineSubsystemGroup.tsx"),
      "utf8",
    );

    expect(projectGroupSource).not.toContain("onRowClick={() => openTaskDetailModal(task)}");
    expect(subsystemGroupSource).not.toContain("onRowClick={() => openTaskDetailModal(task)}");

    expect(projectGroupSource).toContain("onClick={() => openTaskDetailModal(task)}");
    expect(subsystemGroupSource).toContain("onClick={() => openTaskDetailModal(task)}");
  });
});
