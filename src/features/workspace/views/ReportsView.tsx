import { useState } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneRecord, TaskRecord } from "@/types/recordsExecution";
import { IconPlus, IconReports } from "@/components/shared/Icons";
import { type ReportsViewTab } from "@/lib/workspaceNavigation";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";

interface ReportsViewProps {
  bootstrap: BootstrapPayload;
  openTaskDetailsModal: (task: TaskRecord) => void;
  openCreateQaReportModal: () => void;
  openCreateMilestoneReportModal: () => void;
  view: ReportsViewTab;
}

function ReportLaunchCard({
  buttonLabel,
  onClick,
  title,
}: {
  buttonLabel: string;
  onClick: () => void;
  title: string;
}) {
  return (
    <article className="worklog-summary-card">
      <h3>{title}</h3>
      <button className="primary-action queue-toolbar-action" onClick={onClick} type="button">
        <IconPlus />
        {buttonLabel}
      </button>
    </article>
  );
}

function getMilestoneDateTimeMs(milestone: MilestoneRecord) {
  return Date.parse(milestone.endDateTime ?? milestone.startDateTime);
}

function formatMilestoneDate(milestone: MilestoneRecord) {
  const dateTimeMs = getMilestoneDateTimeMs(milestone);
  if (!Number.isFinite(dateTimeMs)) {
    return "No date";
  }

  return new Date(dateTimeMs).toLocaleDateString();
}

function QaReportsView({
  tasks,
  openCreateQaReportModal,
  openTaskDetailsModal,
}: {
  openCreateQaReportModal: () => void;
  openTaskDetailsModal: (task: TaskRecord) => void;
  tasks: readonly TaskRecord[];
}) {
  if (tasks.length === 0) {
    return (
      <>
        <p className="section-copy filter-copy">No tasks are currently waiting for QA.</p>
        <ReportLaunchCard buttonLabel="Add QA report" onClick={openCreateQaReportModal} title="QA" />
      </>
    );
  }

  return (
    <>
      <p className="section-copy filter-copy">
        These tasks are waiting on QA review. Open a task to launch QA details.
      </p>
      <div className="summary-row" style={{ alignItems: "stretch" }}>
        {tasks.map((task) => (
          <article className="worklog-summary-card" key={task.id}>
            <h3>{task.title}</h3>
            <p className="section-copy">{task.summary || "No summary"}</p>
            <p className="section-copy">Due {new Date(task.dueDate).toLocaleDateString()}</p>
            <button
              className="primary-action queue-toolbar-action"
              onClick={() => openTaskDetailsModal(task)}
              type="button"
            >
              Open task details
            </button>
          </article>
        ))}
      </div>
    </>
  );
}

function MilestoneResultsView({
  milestones,
  openCreateMilestoneReportModal,
}: {
  milestones: readonly MilestoneRecord[];
  openCreateMilestoneReportModal: () => void;
}) {
  if (milestones.length === 0) {
    return (
      <p className="section-copy filter-copy">No past milestones are currently available to report.</p>
    );
  }

  return (
    <>
      <p className="section-copy filter-copy">
        All past milestones are listed for milestone-result reporting.
      </p>
      <div className="summary-row" style={{ alignItems: "stretch" }}>
        {milestones.map((milestone) => (
          <article className="worklog-summary-card" key={milestone.id}>
            <h3>{milestone.title}</h3>
            <p className="section-copy">Type: {milestone.type}</p>
            <p className="section-copy">Milestone date: {formatMilestoneDate(milestone)}</p>
            <button
              className="primary-action queue-toolbar-action"
              onClick={openCreateMilestoneReportModal}
              type="button"
            >
              <IconPlus />
              Add milestone result
            </button>
          </article>
        ))}
      </div>
    </>
  );
}

export function ReportsView({
  bootstrap,
  openTaskDetailsModal,
  openCreateMilestoneReportModal,
  openCreateQaReportModal,
  view,
}: ReportsViewProps) {
  const [nowMs] = useState(() => Date.now());
  const qaTasks = bootstrap.tasks.filter((task) => task.status === "waiting-for-qa");
  const pastMilestones = bootstrap.milestones
    .filter((milestone) => getMilestoneDateTimeMs(milestone) < nowMs)
    .sort((left, right) => getMilestoneDateTimeMs(right) - getMilestoneDateTimeMs(left));

  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <p className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <IconReports />
            Reports
          </p>
          <h2>{view === "qa" ? "QA reports" : "Milestone results"}</h2>
        </div>
      </div>

      {view === "qa" ? (
        <QaReportsView
          openCreateQaReportModal={openCreateQaReportModal}
          openTaskDetailsModal={openTaskDetailsModal}
          tasks={qaTasks}
        />
      ) : (
        <MilestoneResultsView
          milestones={pastMilestones}
          openCreateMilestoneReportModal={openCreateMilestoneReportModal}
        />
      )}
    </section>
  );
}
