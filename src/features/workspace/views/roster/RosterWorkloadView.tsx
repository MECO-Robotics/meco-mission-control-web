import { useMemo, useState } from "react";

import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { fetchAvailabilityStatusTone } from "@/features/workspace/views/roster/rosterStatusTone";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { RosterAvailabilityStatus } from "@/types/rosterInsights";

import { RosterInsightsSummaryCards } from "./RosterInsightsSummaryCards";
import {
  filterAndSortRosterMembers,
  formatAvailabilityLabel,
  formatHours,
  type RosterMemberSortMode,
} from "./rosterInsightsViewModel";
import { RosterWorkloadTopbarControls } from "./RosterWorkloadTopbarControls";
import { useRosterInsights } from "./useRosterInsights";

interface RosterWorkloadViewProps {
  bootstrap: BootstrapPayload;
  onOpenTask: (taskId: string) => void;
  selectedProject: BootstrapPayload["projects"][number] | null;
  selectedSeasonId: string | null;
}

const SORT_OPTIONS: Array<{ id: RosterMemberSortMode; name: string }> = [
  { id: "availability", name: "Availability" },
  { id: "load-desc", name: "Workload" },
  { id: "overdue-desc", name: "Overdue" },
  { id: "attendance-desc", name: "Attendance" },
  { id: "name", name: "Name" },
];

const AVAILABILITY_OPTIONS: Array<{ id: RosterAvailabilityStatus | "all"; name: string }> = [
  { id: "all", name: "All statuses" },
  { id: "unavailable", name: "Unavailable" },
  { id: "overloaded", name: "Overloaded" },
  { id: "at-risk", name: "At risk" },
  { id: "available", name: "Available" },
];

export function RosterWorkloadView({
  bootstrap,
  onOpenTask,
  selectedProject,
  selectedSeasonId,
}: RosterWorkloadViewProps) {
  const [searchText, setSearchText] = useState("");
  const [sortMode, setSortMode] = useState<RosterMemberSortMode>("availability");
  const [availabilityFilter, setAvailabilityFilter] = useState<RosterAvailabilityStatus | "all">("all");
  const insightsState = useRosterInsights({
    bootstrap,
    projectId: selectedProject?.id ?? null,
    seasonId: selectedSeasonId,
  });

  const filteredMembers = useMemo(
    () =>
      filterAndSortRosterMembers({
        availabilityFilter,
        members: insightsState.insights.members,
        searchText,
        sortMode,
      }),
    [availabilityFilter, insightsState.insights.members, searchText, sortMode],
  );

  const summaryCards = useMemo(
    () => [
      { id: "open-tasks", label: "Open tasks", value: String(insightsState.insights.summary.openTaskCount) },
      { id: "overdue", label: "Overdue", value: String(insightsState.insights.summary.overdueTaskCount) },
      { id: "blocked", label: "Blocked", value: String(insightsState.insights.summary.blockedTaskCount) },
      {
        id: "unassigned",
        label: "Unassigned",
        value: String(insightsState.insights.summary.unassignedTaskCount),
      },
      {
        id: "unavailable",
        label: "Unavailable",
        value: String(insightsState.insights.summary.unavailableMemberCount),
      },
      {
        id: "attendance",
        label: "Attendance (14d)",
        value: formatHours(insightsState.insights.summary.attendanceHoursLast14Days),
      },
    ],
    [insightsState.insights.summary],
  );

  return (
    <section className={`panel dense-panel roster-layout mc-roster-insights-shell ${WORKSPACE_PANEL_CLASS}`}>
      <AppTopbarSlotPortal slot="controls">
        <RosterWorkloadTopbarControls
          availabilityFilter={availabilityFilter}
          availabilityOptions={AVAILABILITY_OPTIONS}
          searchText={searchText}
          setAvailabilityFilter={setAvailabilityFilter}
          setSearchText={setSearchText}
          setSortMode={setSortMode}
          sortMode={sortMode}
          sortOptions={SORT_OPTIONS}
        />
      </AppTopbarSlotPortal>

      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Workload</h2>
          <p className="section-copy">
            {selectedProject ? selectedProject.name : "All projects"} · assignment load and availability
          </p>
        </div>
      </div>

      <RosterInsightsSummaryCards cards={summaryCards} />

      {insightsState.errorMessage ? (
        <p className="section-copy mc-roster-insights-note">
          Showing local fallback data. {insightsState.errorMessage}
        </p>
      ) : null}

      {filteredMembers.length === 0 ? (
        <div className="empty-state">
          <strong>No members match this filter.</strong>
          <p className="section-copy">Adjust the search or status filter to view workload details.</p>
        </div>
      ) : (
        <div className="mc-roster-member-grid">
          {filteredMembers.map((member) => (
            <article className="mc-roster-member-card" key={member.memberId}>
              <div className="mc-roster-member-header">
                <strong>{member.memberName}</strong>
                <span className={`mc-roster-status-badge ${fetchAvailabilityStatusTone(member.availabilityStatus)}`}>
                  {formatAvailabilityLabel(member.availabilityStatus)}
                </span>
              </div>
              <div className="mc-roster-member-metrics">
                <span>{member.activeTaskCount} active</span>
                <span>{member.overdueTaskCount} overdue</span>
                <span>{member.blockedTaskCount} blocked</span>
                <span>{formatHours(member.remainingOpenHours)} remaining</span>
                <span>{formatHours(member.attendanceHoursLast14Days)} attendance (14d)</span>
              </div>
              {member.topTasks.length > 0 ? (
                <div className="mc-roster-task-list">
                  {member.topTasks.map((task) => (
                    <button
                      className="ghost-button"
                      key={task.id}
                      onClick={() => onOpenTask(task.id)}
                      type="button"
                    >
                      {task.title}
                    </button>
                  ))}
                </div>
              ) : (
                <small className="section-copy">No active task assignments.</small>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
