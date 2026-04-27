import type { BootstrapPayload } from "@/types";
import { IconPlus, IconReports } from "@/components/shared";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared";

interface ReportsViewProps {
  bootstrap: BootstrapPayload;
  openCreateQaReportModal: () => void;
  openCreateEventReportModal: () => void;
}

function ReportLaunchCard({
  count,
  description,
  title,
  onClick,
  buttonLabel,
}: {
  count: number;
  description: string;
  title: string;
  onClick: () => void;
  buttonLabel: string;
}) {
  return (
    <article className="worklog-summary-card">
      <h3>{title}</h3>
      <p className="section-copy">{description}</p>
      <div className="summary-row" style={{ marginTop: "0.9rem" }}>
        <div className="worklog-summary-stat-card" style={{ minWidth: 0 }}>
          <h3>Captured</h3>
          <strong>{count}</strong>
        </div>
      </div>
      <button className="primary-action queue-toolbar-action" onClick={onClick} type="button">
        <IconPlus />
        {buttonLabel}
      </button>
    </article>
  );
}

export function ReportsView({
  bootstrap,
  openCreateEventReportModal,
  openCreateQaReportModal,
}: ReportsViewProps) {
  const qaReports = bootstrap.reports.filter((report) => report.reportType === "QA");
  const eventReports = bootstrap.reports.filter((report) => report.reportType !== "QA");

  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <p className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <IconReports />
            Reports
          </p>
          <h2>QA and Event Result forms</h2>
          <p className="section-copy filter-copy">
            Open the report forms from one sidebar page. Use QA when a task needs review
            confirmation, and use Event Result when you need to record findings from an event.
          </p>
        </div>
      </div>

      <div className="summary-row" style={{ alignItems: "stretch" }}>
        <ReportLaunchCard
          buttonLabel="Add QA report"
          count={qaReports.length}
          description="Create a QA report tied to a task, the reviewers, and the outcome of that review."
          onClick={openCreateQaReportModal}
          title="QA report"
        />
        <ReportLaunchCard
          buttonLabel="Add event result"
          count={eventReports.length}
          description="Create an event result entry tied to the event scope and its findings."
          onClick={openCreateEventReportModal}
          title="Event Result"
        />
      </div>
    </section>
  );
}
