import * as React from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import { pruneTimelineFilterSelections } from "@/features/workspace/views/timeline/hooks/useTimelineViewFilters";
import {
  buildTimelineDisciplineFilterOptions,
  buildTimelineSubsystemFilterOptions,
  countActiveTimelineFilters,
  filterTimelineMilestonesByProjectSelection,
  filterTimelineTasks,
  getTimelineFilterToneClassName,
  getTimelineStatusToneClassName,
  resolveTimelineFilteredProjectIds,
  TIMELINE_TASK_PRIORITY_OPTIONS,
  TIMELINE_TASK_STATUS_OPTIONS,
} from "@/features/workspace/views/timeline/model/timelineViewFilters";
import { createBootstrap, createTimelineMilestone } from "./timelineTestFixtures";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("TimelineView", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-15T12:00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("uses shared tones for status values and stable tones for filter options", () => {
    expect(getTimelineStatusToneClassName("in-progress")).toBe("filter-tone-warning");
    expect(getTimelineStatusToneClassName("complete")).toBe("filter-tone-success");
    expect(getTimelineStatusToneClassName("unknown")).toBe("filter-tone-neutral");
    expect(getTimelineFilterToneClassName("a")).toBe("filter-tone-warning");
  });

  it("filters timeline tasks by project, discipline, subsystem, status, and priority", () => {
    const bootstrap = createBootstrap();
    const scopedBootstrap: BootstrapPayload = {
      ...bootstrap,
      projects: [
        ...bootstrap.projects,
        {
          ...bootstrap.projects[0],
          id: "project-2",
          name: "Pit Display",
        },
      ],
      subsystems: [
        ...bootstrap.subsystems,
        {
          ...bootstrap.subsystems[0],
          id: "subsystem-2",
          name: "Controls",
          projectId: "project-2",
        },
      ],
      disciplines: [
        ...bootstrap.workTypes,
        {
          id: "discipline-2",
          code: "programming",
          name: "Software",
        },
      ],
      tasks: [
        bootstrap.tasks[0],
        {
          ...bootstrap.tasks[0],
          id: "task-2",
          projectId: "project-2",
          subsystemIds: ["subsystem-2", "", "subsystem-2"],
          disciplineId: "discipline-2",
          priority: "low",
          status: "complete",
          title: "Driver station status panel",
        },
      ],
    };

    const filteredTasks = filterTimelineTasks({
      bootstrap: scopedBootstrap,
      disciplineFilter: ["discipline-2"],
      isAllProjectsView: true,
      priorityFilter: ["low"],
      projectFilter: ["project-2"],
      statusFilter: ["complete"],
      subsystemFilter: ["subsystem-2"],
      tasks: scopedBootstrap.tasks,
    });

    expect(filteredTasks.map((task) => task.id)).toEqual(["task-2"]);
    expect(
      countActiveTimelineFilters({
        activePersonFilter: ["member-1"],
        disciplineFilter: ["discipline-2"],
        isAllProjectsView: true,
        priorityFilter: ["low"],
        projectFilter: ["project-2"],
        statusFilter: ["complete"],
        subsystemFilter: ["subsystem-2"],
      }),
    ).toBe(6);
    expect(
      countActiveTimelineFilters({
        activePersonFilter: ["member-1"],
        disciplineFilter: ["discipline-2"],
        isAllProjectsView: false,
        priorityFilter: ["low"],
        projectFilter: ["project-2"],
        statusFilter: ["complete"],
        subsystemFilter: ["subsystem-2"],
      }),
    ).toBe(5);
  });

  it("prunes stale timeline filter selections when bootstrap options change", () => {
    const bootstrap = createBootstrap();
    const statusId = TIMELINE_TASK_STATUS_OPTIONS[0]!.id;
    const priorityId = TIMELINE_TASK_PRIORITY_OPTIONS[0]!.id;
    const prunedFilters = pruneTimelineFilterSelections(
      {
        disciplineFilter: ["discipline-1", "stale-discipline"],
        priorityFilter: [priorityId, "stale-priority"],
        projectFilter: ["project-1", "stale-project"],
        statusFilter: [statusId, "stale-status"],
        subsystemFilter: ["subsystem-1", "stale-subsystem"],
      },
      {
        disciplineFilterOptions: buildTimelineDisciplineFilterOptions(bootstrap),
        isAllProjectsView: true,
        projectFilterOptions: bootstrap.projects,
        subsystemFilterOptions: buildTimelineSubsystemFilterOptions(bootstrap),
      },
    );

    expect(prunedFilters).toEqual({
      disciplineFilter: ["discipline-1"],
      priorityFilter: [priorityId],
      projectFilter: ["project-1"],
      statusFilter: [statusId],
      subsystemFilter: ["subsystem-1"],
    });

    expect(
      pruneTimelineFilterSelections(prunedFilters, {
        disciplineFilterOptions: buildTimelineDisciplineFilterOptions(bootstrap),
        isAllProjectsView: false,
        projectFilterOptions: bootstrap.projects,
        subsystemFilterOptions: buildTimelineSubsystemFilterOptions(bootstrap),
      }).projectFilter,
    ).toEqual([]);
  });

  it("keeps global milestones visible when filtering all-projects timeline by project", () => {
    const projectFilter = ["project-1"];
    const filteredMilestones = filterTimelineMilestonesByProjectSelection({
      isAllProjectsView: true,
      milestones: [
        createTimelineMilestone({
          id: "global-milestone",
          title: "Global readiness review",
          projectIds: [],
        }),
        createTimelineMilestone({
          id: "selected-project-milestone",
          title: "Robot readiness review",
          projectIds: ["project-1"],
        }),
        createTimelineMilestone({
          id: "other-project-milestone",
          title: "Pit display review",
          projectIds: ["project-2"],
        }),
      ],
      projectFilter,
      scopedProjectIdSet: new Set(projectFilter),
    });

    expect(filteredMilestones.map((milestone) => milestone.id)).toEqual([
      "global-milestone",
      "selected-project-milestone",
    ]);
  });

  it("keeps modal milestone project scope separate from the active project filter", () => {
    const scopedProjectIds = ["project-1", "project-2"];
    const filteredProjectIds = resolveTimelineFilteredProjectIds({
      isAllProjectsView: true,
      projectFilter: ["project-1"],
      scopedProjectIds,
    });

    expect(filteredProjectIds).toEqual(["project-1"]);
    expect(scopedProjectIds).toEqual(["project-1", "project-2"]);
  });
});
