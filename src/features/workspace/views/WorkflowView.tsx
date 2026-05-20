import { useMemo, useState } from "react";

import type { ArtifactRecord } from "@/types/recordsInventory";
import type { BootstrapPayload } from "@/types/bootstrap";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { WorkspaceFloatingAddButton } from "@/features/workspace/shared/ui";
import { EditableHoverIndicator, TableCell } from "@/features/workspace/shared/table/workspaceTableChrome";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { useFilterChangeMotionClass } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";

interface WorkflowViewProps {
  artifacts: ArtifactRecord[];
  bootstrap: BootstrapPayload;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  openCreateWorkstreamModal: () => void;
  openEditWorkstreamModal: (workstream: BootstrapPayload["workstreams"][number]) => void;
}

export function WorkflowView({
  artifacts,
  bootstrap,
  membersById,
  openCreateWorkstreamModal,
  openEditWorkstreamModal,
}: WorkflowViewProps) {
  const [search, setSearch] = useState("");
  const [showArchivedWorkflows, setShowArchivedWorkflows] = useState(false);

  const workflowRows = useMemo(() => {
    return bootstrap.workstreams
      .map((workstream) => {
        const workstreamTasks = bootstrap.tasks.filter(
          (task) =>
            task.workstreamId === workstream.id ||
            task.workstreamIds.includes(workstream.id),
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
              .flatMap((task) => {
                const assigneeIds = Array.isArray(task.assigneeIds) ? task.assigneeIds : [];
                return assigneeIds.length > 0
                  ? assigneeIds
                  : task.ownerId
                    ? [task.ownerId]
                    : [];
              })
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
    const rows = workflowRows.filter((row) =>
      showArchivedWorkflows ? true : !row.workstream.isArchived,
    );

    if (normalizedSearch.length === 0) {
      return rows;
    }

    return rows.filter((row) =>
      [
        row.workstream.name,
        row.workstream.description,
        row.contributorNames.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [search, showArchivedWorkflows, workflowRows]);
  const workflowFilterMotionClass = useFilterChangeMotionClass([search, showArchivedWorkflows]);

  return (
    <section className={`panel dense-panel subsystem-manager-shell ${WORKSPACE_PANEL_CLASS}`}>
      <AppTopbarSlotPortal slot="controls">
        <div className="panel-actions filter-toolbar subsystem-manager-toolbar">
          <TopbarResponsiveSearch
            ariaLabel="Search workflows"
            compactPlaceholder="Search"
            onChange={setSearch}
            placeholder="Search workflows..."
            value={search}
          />
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              color: "var(--text-copy)",
              fontSize: "0.85rem",
            }}
          >
            <input
              checked={showArchivedWorkflows}
              onChange={(milestone) => setShowArchivedWorkflows(milestone.target.checked)}
              type="checkbox"
            />
            Show archived
          </label>
        </div>
      </AppTopbarSlotPortal>

      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2 style={{ color: "var(--text-title)" }}>Workflow manager</h2>
        </div>
      </div>

      <WorkspaceFloatingAddButton
        ariaLabel="Add workflow"
        onClick={openCreateWorkstreamModal}
        title="Add workflow"
      />

      <div className="panel-subsection subsystem-manager-list" style={{ flex: "1 1 620px" }}>
        <div className={`table-shell subsystem-manager-list-shell ${workflowFilterMotionClass}`}>
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
            (() => {
              const accentColor = row.workstream.color ?? "var(--meco-blue)";

              return (
                <div
                  className="ops-table ops-row subsystem-manager-row editable-row-clickable editable-hover-target editable-hover-target-row"
                  data-tutorial-target="edit-workflow-row"
                  data-workspace-color={row.workstream.color}
                  key={row.workstream.id}
                  onClick={() => openEditWorkstreamModal(row.workstream)}
                  onKeyDown={(milestone) => {
                    if (milestone.target !== milestone.currentTarget) {
                      return;
                    }
                    if (milestone.key === "Enter" || milestone.key === " ") {
                      milestone.preventDefault();
                      openEditWorkstreamModal(row.workstream);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  style={{
                    gridTemplateColumns: "minmax(220px, 2.2fr) 0.8fr 0.8fr 1.2fr",
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border-base)",
                    color: "var(--text-copy)",
                    background: "var(--row-bg, var(--bg-row-alt))",
                    boxShadow: `inset 4px 0 0 ${accentColor}`,
                  }}
                >
                  <TableCell label="Workflow">
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "flex-start",
                        gap: "0.65rem",
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: "0.75rem",
                          height: "0.75rem",
                          borderRadius: "999px",
                          marginTop: "0.2rem",
                          flexShrink: 0,
                          background: accentColor,
                          boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.08)",
                        }}
                      />
                      <span style={{ display: "grid", gap: "0.2rem" }}>
                        <strong style={{ color: "var(--text-title)" }}>{row.workstream.name}</strong>
                        {row.workstream.isArchived ? (
                          <small style={{ color: "var(--text-copy)" }}>Archived</small>
                        ) : null}
                        <small>{row.workstream.description || "No description yet."}</small>
                      </span>
                    </span>
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
                  <EditableHoverIndicator />
                </div>
              );
            })()
          ))}

          {filteredRows.length === 0 ? (
            <p className="empty-state">No workflows match the current search.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
