/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { WorkLogEditorModal } from "@/features/workspace/modals/workReports/WorkLogEditorModal";
import type { BootstrapPayload } from "@/types/bootstrap";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("WorkLogEditorModal", () => {
  it("shows the task's first ordered subsystem as its selected context", () => {
    const bootstrap: BootstrapPayload = {
      ...EMPTY_BOOTSTRAP,
      subsystems: [
        { id: "secondary", name: "Secondary" } as BootstrapPayload["subsystems"][number],
        { id: "primary", name: "Primary" } as BootstrapPayload["subsystems"][number],
      ],
      tasks: [
        {
          id: "task-1",
          projectId: "project-1",
          subsystemIds: ["primary", "secondary"],
          summary: "Task summary",
          title: "Task title",
        } as BootstrapPayload["tasks"][number],
      ],
    };

    const html = renderToStaticMarkup(
      React.createElement(WorkLogEditorModal, {
        bootstrap,
        closeWorkLogModal: jest.fn(),
        handleWorkLogSubmit: jest.fn(),
        isSavingWorkLog: false,
        requestPhotoUpload: jest.fn(),
        setWorkLogDraft: jest.fn(),
        workLogDraft: {
          date: "2026-09-26",
          hours: 1,
          notes: "",
          participantIds: [],
          photoUrl: "",
          taskId: "task-1",
        },
      }),
    );

    expect(html).toContain("Primary - Task summary");
    expect(html).not.toContain("Secondary - Task summary");
  });
});
