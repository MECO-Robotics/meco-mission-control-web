/// <reference types="jest" />

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";

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
        targetMilestoneId: null,
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

  it("separates timeline row selection from task detail opening", () => {
    const bootstrap = createBootstrap();
    const openTaskDetailModal = jest.fn();
    let capturedOpenTaskDetailModal: ((task: TaskRecord) => void) | null = null;
    let capturedSelectTaskRow: ((task: TaskRecord) => void) | null = null;

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const React = require("react");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { renderToStaticMarkup } = require("react-dom/server");

      (globalThis as typeof globalThis & { React: typeof React }).React = React;

      jest.doMock("@/features/workspace/views/timeline/TimelineGridBody", () => ({
        TimelineGridBody: ({
          openTaskDetailModal: forwardedOpenTaskDetailModal,
          selectTaskRow: forwardedSelectTaskRow,
        }: {
          openTaskDetailModal: (task: TaskRecord) => void;
          selectTaskRow: (task: TaskRecord) => void;
        }) => {
          capturedOpenTaskDetailModal = forwardedOpenTaskDetailModal;
          capturedSelectTaskRow = forwardedSelectTaskRow;
          return React.createElement("div");
        },
      }));

      // eslint-disable-next-line @typescript-eslint/no-require-imports
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
          onDeleteTimelineMilestone: jest.fn(),
          onSaveTimelineMilestone: jest.fn(),
          triggerCreateMilestoneToken: 0,
        }),
      );
    });

    expect(capturedOpenTaskDetailModal).not.toBeNull();
    expect(capturedSelectTaskRow).not.toBeNull();

    const forwardedTaskDetailOpener = capturedOpenTaskDetailModal!;
    const forwardedTaskRowSelector = capturedSelectTaskRow!;

    forwardedTaskRowSelector(bootstrap.tasks[0]);

    expect(openTaskDetailModal).not.toHaveBeenCalled();

    forwardedTaskDetailOpener(bootstrap.tasks[0]);

    expect(openTaskDetailModal).toHaveBeenCalledTimes(1);
    expect(openTaskDetailModal).toHaveBeenCalledWith(bootstrap.tasks[0]);
  });

  it("limits timeline detail opening to the task label and task bar, not the row background", () => {
    const projectGroupSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineProjectGroup.tsx"),
      "utf8",
    );
    const subsystemRowGroupSource = readFileSync(
      join(
        process.cwd(),
        "src/features/workspace/views/timeline/components/TimelineSubsystemRowGroup.tsx",
      ),
      "utf8",
    );
    const statusCellSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineTaskStatusCell.tsx"),
      "utf8",
    );

    expect(projectGroupSource).toContain("selectTaskRow={selectTaskRow}");
    expect(projectGroupSource).toContain("onOpenTask={openTaskDetailModal}");
    expect(subsystemRowGroupSource).toContain("onOpenTask={openTaskDetailModal}");
    expect(subsystemRowGroupSource).toContain("onSelectTaskRow={selectTaskRow}");
    expect(statusCellSource).toContain("onClick={() => onOpenTask(task)}");
  });

  it("opens milestone details from the timeline underlay and renders the detail modal", () => {
    const underlaySource = readFileSync(
      join(
        process.cwd(),
        "src/features/workspace/views/timeline/portals/TimelineMilestoneUnderlaysPortal.tsx",
      ),
      "utf8",
    );
    const detailModalSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineMilestoneDetailModal.tsx"),
      "utf8",
    );
    const timelineViewSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineView.tsx"),
      "utf8",
    );

    expect(underlaySource).toContain('aria-label={`Open milestone ${underlay.milestone.title}`}');
    expect(underlaySource).toContain("role=\"button\"");
    expect(underlaySource).toContain("onMouseEnter={(event) => onShowMilestonePopup(event.currentTarget, underlay.milestone)}");
    expect(underlaySource).toContain("onMouseLeave={onHideMilestonePopup}");
    expect(underlaySource).toContain("onClick={() => onOpenMilestoneDetails(underlay.milestone)}");
    expect(timelineViewSource).toContain("onHideMilestonePopup={data.clearHoveredMilestonePopup}");
    expect(timelineViewSource).toContain("onShowMilestonePopup={data.showMilestoneUnderlayPopup}");
    expect(detailModalSource).toContain("MilestonesEventDetailsModal");
    expect(timelineViewSource).toContain("<TimelineMilestoneDetailModal");
  });

  it("updates timeline hover geometry on shell scroll", () => {
    const overlayHookSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/hooks/useTimelineMilestoneOverlaySync.ts"),
      "utf8",
    );

    expect(overlayHookSource).toContain("const handleScroll = () =>");
    expect(overlayHookSource).toContain('shell.addEventListener("scroll", handleScroll, { passive: true })');
    expect(overlayHookSource).toContain('shell.removeEventListener("scroll", handleScroll)');
    expect(overlayHookSource).toContain("setIsTimelineShellScrolling(true)");
    expect(overlayHookSource).toContain("setIsTimelineShellScrolling(false)");
  });

  it("supports keyboard and touch activation for the timeline interval switch", () => {
    const toolbarSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineToolbar.tsx"),
      "utf8",
    );

    expect(toolbarSource).toContain("onFocusCapture={openIntervalSwitch}");
    expect(toolbarSource).toContain("onPointerDownCapture={handleIntervalSwitchPointerDown}");
    expect(toolbarSource).toContain("onClick={openIntervalSwitch}");
    expect(toolbarSource).toContain("onKeyDown={handleIntervalPillKeyDown}");
  });
});
