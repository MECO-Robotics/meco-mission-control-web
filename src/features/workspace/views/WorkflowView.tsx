import { useMemo, useState } from "react";

import type { ArtifactRecord, BootstrapPayload } from "@/types";
import {
  SearchToolbarInput,
  TableCell,
} from "@/features/workspace/shared";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared";

interface WorkflowViewProps {
  artifacts: ArtifactRecord[];
  bootstrap: BootstrapPayload;
  membersById: Record<string, BootstrapPayload["members"][number]>;
}

export function WorkflowView({
  artifacts,
  bootstrap,
  membersById,
}: WorkflowViewProps) {
  const [search, setSearch] = useState("");

  const workflowRows = useMemo(() => {
    return bootstrap.workstreams
      .map((workstream) => {
        const workstreamTasks = bootstrap.tasks.filter(
          (task) => task.workstreamId === workstream.id,
        );
        const openTaskCount = workstreamTasks.filter(
          (task) => task.status !== "complete",
        ).length;
        const workstreamArtifacts = artifacts.filter(
          (artifact) => artifact.workstreamId === workstream.id,
        );
        const contributorNames = Array.from(
          new Set(
            workstreamTasks
              .map((task) => task.ownerId)
              .filter((ownerId): ownerId is string => Boolean(ownerId))
              .map((ownerId) => membersById[ownerId]?.name ?? "Unknown"),
          ),
        );

        return {
          artifactCount: workstreamArtifacts.length,
          contributorNames,
          openTaskCount,
          taskCount: workstreamTasks.length,
          workstream,
        };
      })
      .sort((left, right) => left.workstream.name.localeCompare(right.workstream.name));
  }, [artifacts, bootstrap.tasks, bootstrap.workstreams, membersById]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (normalizedSearch.length === 0) {
      return workflowRows;
    }

    return workflowRows.filter((row) =>
      [
        row.workstream.name,
        row.workstream.description,
        row.contributorNames.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [search, workflowRows]);

  const projectLevelArtifactCount = useMemo(
    () => artifacts.filter((artifact) => artifact.workstreamId === null).length,
    [artifacts],
  );

  const openTaskTotal = useMemo(
    () => filteredRows.reduce((total, row) => total + row.openTaskCount, 0),
    [filteredRows],
  );

  return (
    <section className={`panel dense-panel subsystem-manager-shell ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2 style={{ color: "var(--text-title)" }}>Workflow manager</h2>
          <p className="section-copy filter-copy" style={{ color: "var(--text-copy)" }}>
            Workstream-centric view for non-robot project planning.
          </p>
        </div>
        <div className="panel-actions filter-toolbar subsystem-manager-toolbar">
          <SearchToolbarInput
            ariaLabel="Search workflows"
            onChange={setSearch}
            placeholder="Search workflows..."
            value={search}
          />
        </div>
      </div>

      <div
        className="summary-row"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "0.6rem",
        }}
      >
        <div className="summary-chip">
          <span>Visible workflows</span>
          <strong>{filteredRows.length}</strong>
        </div>
        <div className="summary-chip">
          <span>Open tasks</span>
          <strong>{openTaskTotal}</strong>
        </div>
        <div className="summary-chip">
          <span>Project-level artifacts</span>
          <strong>{projectLevelArtifactCount}</strong>
        </div>
      </div>

      <div className="panel-subsection subsystem-manager-list" style={{ flex: "1 1 620px" }}>
        <div className="table-shell subsystem-manager-list-shell">
          <div
            className="ops-table ops-table-header subsystem-manager-table-header"
            style={{
              gridTemplateColumns: "minmax(220px, 2.2fr) 0.8fr 0.8fr 1.2fr",
              borderBottom: "1px solid var(--border-base)",
              color: "var(--text-copy)",
            }}
          >
            <span style={{ textAlign: "left" }}>Workflow</span>
            <span>Open tasks</span>
            <span>Artifacts</span>
            <span>Contributors</span>
          </div>

          {filteredRows.map((row) => (
            <div
              className="ops-table ops-row subsystem-manager-row"
              key={row.workstream.id}
              style={{
                gridTemplateColumns: "minmax(220px, 2.2fr) 0.8fr 0.8fr 1.2fr",
                padding: "12px 16px",
                borderBottom: "1px solid var(--border-base)",
                color: "var(--text-copy)",
                background: "var(--row-bg, var(--bg-row-alt))",
              }}
            >
              <TableCell label="Workflow">
                <strong style={{ color: "var(--text-title)" }}>{row.workstream.name}</strong>
                <small>{row.workstream.description || "No description yet."}</small>
              </TableCell>
              <TableCell label="Open tasks">
                <strong style={{ color: "var(--text-title)" }}>{row.openTaskCount}</strong>
                <small>{row.taskCount} total</small>
              </TableCell>
              <TableCell label="Artifacts">{row.artifactCount}</TableCell>
              <TableCell label="Contributors">
                {row.contributorNames.length > 0
                  ? row.contributorNames.join(", ")
                  : "Unassigned"}
              </TableCell>
            </div>
          ))}

          {filteredRows.length === 0 ? (
            <p className="empty-state">No workflows match the current search.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}



