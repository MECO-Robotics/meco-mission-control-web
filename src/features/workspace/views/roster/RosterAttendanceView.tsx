import { useMemo, useState } from "react";

import { SearchToolbarInput } from "@/features/workspace/shared/filters/workspaceSearchToolbarInput";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { RosterAvailabilityStatus } from "@/types/rosterInsights";

import { RosterInsightsSummaryCards } from "./RosterInsightsSummaryCards";
import { fetchAvailabilityStatusTone } from "./rosterStatusTone";
import {
  filterAndSortRosterMembers,
  filterRecentAttendance,
  formatAvailabilityLabel,
  formatHours,
} from "./rosterInsightsViewModel";
import { useRosterInsights } from "./useRosterInsights";

interface RosterAttendanceViewProps {
  bootstrap: BootstrapPayload;
  selectedProject: BootstrapPayload["projects"][number] | null;
  selectedSeasonId: string | null;
}

const AVAILABILITY_OPTIONS: Array<{ id: RosterAvailabilityStatus | "all"; name: string }> = [
  { id: "all", name: "All statuses" },
  { id: "unavailable", name: "Unavailable" },
  { id: "overloaded", name: "Overloaded" },
  { id: "at-risk", name: "At risk" },
  { id: "available", name: "Available" },
];

export function RosterAttendanceView({
  bootstrap,
  selectedProject,
  selectedSeasonId,
}: RosterAttendanceViewProps) {
  const [searchText, setSearchText] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState<RosterAvailabilityStatus | "all">("all");

  const insightsState = useRosterInsights({
    bootstrap,
    projectId: selectedProject?.id ?? null,
    seasonId: selectedSeasonId,
  });

  const members = useMemo(
    () =>
      filterAndSortRosterMembers({
        availabilityFilter,
        members: insightsState.insights.members,
        searchText,
        sortMode: "attendance-desc",
      }),
    [availabilityFilter, insightsState.insights.members, searchText],
  );
  const recentAttendance = useMemo(
    () => filterRecentAttendance({ items: insightsState.insights.recentAttendance, searchText }),
    [insightsState.insights.recentAttendance, searchText],
  );
  const timelinePreview = insightsState.insights.attendanceTimeline.slice(0, 14);

  const summaryCards = [
    {
      id: "attendance-30",
      label: "Attendance (30d)",
      value: formatHours(insightsState.insights.summary.attendanceHoursLast30Days),
    },
    {
      id: "attendance-14",
      label: "Attendance (14d)",
      value: formatHours(insightsState.insights.summary.attendanceHoursLast14Days),
    },
    {
      id: "no-recent",
      label: "No recent attendance + active tasks",
      value: String(insightsState.insights.summary.noRecentAttendanceWithTasksCount),
    },
    {
      id: "waiting-qa",
      label: "Waiting QA tasks",
      value: String(insightsState.insights.summary.waitingForQaTaskCount),
    },
  ];

  return (
    <section className={`panel dense-panel roster-layout mc-roster-insights-shell ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Attendance</h2>
          <p className="section-copy">
            {selectedProject ? selectedProject.name : "All projects"} · attendance to availability cross-check
          </p>
        </div>
      </div>

      <RosterInsightsSummaryCards cards={summaryCards} />

      <div className="panel-actions filter-toolbar mc-roster-insights-toolbar">
        <SearchToolbarInput
          ariaLabel="Search attendance"
          onChange={setSearchText}
          placeholder="Search members..."
          value={searchText}
        />
        <CompactFilterMenu
          activeCount={availabilityFilter === "all" ? 0 : 1}
          ariaLabel="Filter by availability"
          buttonLabel="Status"
          items={[
            {
              label: "Availability",
              content: (
                <select
                  aria-label="Filter attendance by availability"
                  className="task-queue-sort-menu-select"
                  onChange={(event) =>
                    setAvailabilityFilter(event.target.value as RosterAvailabilityStatus | "all")
                  }
                  value={availabilityFilter}
                >
                  {AVAILABILITY_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              ),
            },
          ]}
        />
      </div>

      {insightsState.errorMessage ? (
        <p className="section-copy mc-roster-insights-note">
          Showing local fallback data. {insightsState.errorMessage}
        </p>
      ) : null}

      <div className="mc-roster-attendance-grid">
        <article className="mc-roster-attendance-card">
          <h3>Availability by member</h3>
          {members.length === 0 ? (
            <p className="section-copy">No members match this filter.</p>
          ) : (
            <div className="mc-roster-attendance-list">
              {members.map((member) => (
                <div className="mc-roster-attendance-row" key={member.memberId}>
                  <div className="mc-roster-attendance-row-main">
                    <strong>{member.memberName}</strong>
                    <small>
                      {formatHours(member.attendanceHoursLast14Days)} attendance · {member.activeTaskCount} active tasks
                    </small>
                  </div>
                  <span className={`mc-roster-status-badge ${fetchAvailabilityStatusTone(member.availabilityStatus)}`}>
                    {formatAvailabilityLabel(member.availabilityStatus)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="mc-roster-attendance-card">
          <h3>Recent attendance sessions</h3>
          {recentAttendance.length === 0 ? (
            <p className="section-copy">No attendance records found in this scope.</p>
          ) : (
            <div className="mc-roster-attendance-list">
              {recentAttendance.slice(0, 16).map((entry) => (
                <div className="mc-roster-attendance-row" key={entry.id}>
                  <div className="mc-roster-attendance-row-main">
                    <strong>{entry.memberName}</strong>
                    <small>
                      {entry.date} · {formatHours(entry.totalHours)} · {entry.activeTaskCount} active tasks
                    </small>
                  </div>
                  <span className={`mc-roster-status-badge ${fetchAvailabilityStatusTone(entry.availabilityStatus)}`}>
                    {formatAvailabilityLabel(entry.availabilityStatus)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>

      {timelinePreview.length > 0 ? (
        <div className="mc-roster-timeline-strip" role="list">
          {timelinePreview.map((point) => (
            <span className="mc-roster-timeline-chip" key={point.date} role="listitem">
              <strong>{point.date}</strong>
              <small>
                {formatHours(point.totalHours)} · {point.memberCount} members
              </small>
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
