/// <reference types="jest" />

import { readFileSync } from "node:fs";
import { renderTaskModal } from "./support/WorkspaceModals.task.test.helpers";

describe("TaskEditorModal", () => {
  it("hides actual hours while creating a task", () => {
    expect(renderTaskModal("create")).not.toContain("Actual hours");
  });

  it("renders the task title in the detailed editor header", () => {
    const markup = renderTaskModal("create");

    expect(markup).toContain("task-details-header");
    expect(markup).toContain('data-inline-edit-field="title"');
  });

  it("shows the detail shell in edit mode", () => {
    expect(renderTaskModal("create")).not.toContain("Actual hours");
    expect(renderTaskModal("edit")).toContain("Edit Task Details");
    expect(renderTaskModal("create")).toContain("Create Task Details");
    expect(renderTaskModal("edit")).not.toContain("View Task Details");
    expect(renderTaskModal("edit")).toContain("Logged:");
    expect(renderTaskModal("edit")).not.toContain("Actual hours");
  });

  it("renders the task title as an editable field in edit mode", () => {
    const markup = renderTaskModal("edit");

    expect(markup).toContain('data-inline-edit-field="title"');
  });

  it("uses the detailed task shell in the task editor", () => {
    const createMarkup = renderTaskModal("create");
    const editMarkup = renderTaskModal("edit");

    expect(createMarkup).toContain("task-details-header");
    expect(createMarkup).toContain("task-details-overview-grid");
    expect(createMarkup).toContain('data-inline-edit-field="project"');
    expect(editMarkup).toContain("task-details-header");
    expect(editMarkup).toContain("task-details-overview-grid");
    expect(editMarkup).toContain('data-inline-edit-field="priority"');
    expect(editMarkup).toContain("task-queue-board-card-priority task-queue-board-card-priority-medium");
    expect(editMarkup).toContain('data-inline-edit-field="owner"');
    expect(editMarkup).toContain('data-inline-edit-field="assigned"');
    expect(editMarkup).toContain("task-details-assigned-list");
    expect(editMarkup).toContain('data-inline-edit-field="mentor"');
    expect(editMarkup).toContain('data-inline-edit-field="dueDate"');
    expect(editMarkup).toContain('data-inline-edit-field="targetMilestone"');
    expect(editMarkup).toContain('data-inline-edit-field="discipline"');
    expect(editMarkup).toContain("task-details-overview-subsystem");
    expect(editMarkup).toContain('data-inline-edit-field="subsystem"');
    expect(editMarkup).toContain('<span class="task-detail-copy">Mechanism</span>');
    expect(editMarkup).toContain('<span class="task-detail-copy">Parts</span>');
    expect(editMarkup).toContain('data-inline-edit-field="summary"');
  });

  it("shows mechanism and parts headers in the detailed task editor", () => {
    const markup = renderTaskModal("edit");

    expect(markup).toContain('<span class="task-detail-copy">Mechanism</span>');
    expect(markup).toContain('<span class="task-detail-copy">Parts</span>');
  });

  it("keeps mechanism and parts fields collapsible in edit mode", () => {
    const markup = renderTaskModal("edit");

    expect(markup).toContain('<summary class="task-detail-collapsible-summary"><span class="task-detail-collapsible-summary-main"><span class="task-detail-collapsible-icon" aria-hidden="true"></span><span class="task-detail-copy">Mechanism</span></span>');
    expect(markup).toContain('<summary class="task-detail-collapsible-summary"><span class="task-detail-collapsible-summary-main"><span class="task-detail-collapsible-icon" aria-hidden="true"></span><span class="task-detail-copy">Parts</span></span>');
    expect(markup).toContain('<div class="task-detail-collapsible-body"><p class="task-detail-copy task-detail-empty"');
  });

  it("keeps the advanced section in edit mode", () => {
    expect(renderTaskModal("edit")).toContain(">Advanced<");
  });

  it("preserves an open advanced section in edit mode markup", () => {
    const markup = renderTaskModal("edit", undefined, true);

    expect(markup).toContain('task-details-section-collapse modal-wide" open');
  });

  it("renders a multi-student assignment control", () => {
    const markup = renderTaskModal("create");

    expect(markup).toContain("Assigned");
    expect(markup).toContain('data-inline-edit-field="assigned"');
  });

  it("limits task disciplines to media options for media projects", () => {
    const markup = renderTaskModal(
      "create",
      {
        projectId: "project-2",
        subsystemId: "subsystem-2",
        subsystemIds: ["subsystem-2"],
        disciplineId: "photography",
      },
      true,
    );

    expect(markup).toContain("Photography");
    expect(markup).not.toContain("Design");
    expect(markup).not.toContain("Manufacturing");
  });

  it("shows save and cancel controls in edit mode", () => {
    const markup = renderTaskModal("edit");

    expect(markup).not.toContain("Actual hours");
    expect(markup).toContain("Dependencies");
    expect(markup).toContain("Blockers");
    expect(markup).toContain("Cancel");
    expect(markup).toContain("Save changes");
  });

  it("omits task traceability text", () => {
    expect(renderTaskModal("create")).not.toContain("Task traceability");
    expect(renderTaskModal("edit")).not.toContain("Task traceability");
  });

  it("keeps task editor modal fields readable across responsive widths", () => {
    const taskEditorModalCss = readFileSync(
      "src/app/styles/responsive/layout/task-editor-modal.css",
      "utf8",
    );
    const responsiveLayoutCss = readFileSync("src/app/styles/responsive/layout.css", "utf8");
    const overviewCss = readFileSync(
      "src/app/styles/views/taskDetails/overview/assigned.css",
      "utf8",
    );

    expect(renderTaskModal("create")).toContain(
      "task-details-section-grid task-details-overview-grid modal-wide",
    );
    expect(responsiveLayoutCss).toContain('@import url("./layout/task-editor-modal.css");');
    expect(taskEditorModalCss).toContain(".task-editor-modal .task-details-modal");
    expect(taskEditorModalCss).toContain("width: min(920px, calc(100vw - 2rem));");
    expect(taskEditorModalCss).toContain("@media (max-width: 900px)");
    expect(taskEditorModalCss).toContain(".task-editor-modal .field > span:first-child");
    expect(overviewCss).toContain(
      "grid-template-columns: minmax(8.5rem, 0.85fr) minmax(11rem, 1fr) minmax(13rem, 1.2fr);",
    );
    expect(overviewCss).toContain("grid-template-areas: none;");
  });
});
