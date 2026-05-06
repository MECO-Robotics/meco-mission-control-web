import { IconEdit, IconPlus } from "@/components/shared/Icons";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MechanismRecord, SubsystemRecord } from "@/types/recordsOrganization";
import { TableCell } from "@/features/workspace/shared/table/workspaceTableChrome";
import { formatIterationVersion } from "@/lib/appUtils/common";
import type { MembersById } from "@/features/workspace/shared/model/workspaceTypes";

import { formatMemberName, getSubsystemMechanisms, getSubsystemParentName } from "./subsystemsViewData";
import type { SubsystemCountsById } from "./subsystemsViewTypes";

interface SubsystemsTableSectionProps {
  bootstrap: BootstrapPayload;
  countsBySubsystemId: SubsystemCountsById;
  filteredSubsystems: SubsystemRecord[];
  membersById: MembersById;
  openCreateMechanismModal: (subsystemId?: string) => void;
  openCreatePartInstanceModal: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  openEditMechanismModal: (mechanism: MechanismRecord) => void;
  openEditSubsystemModal: (subsystem: SubsystemRecord) => void;
  selectedSubsystemId: string;
  showArchivedMechanisms: boolean;
  subsystemFilterMotionClass: string;
  handleSubsystemSelection: (subsystemId: string) => void;
}

export function SubsystemsTableSection({
  bootstrap,
  countsBySubsystemId,
  filteredSubsystems,
  membersById,
  openCreateMechanismModal,
  openCreatePartInstanceModal,
  openEditMechanismModal,
  openEditSubsystemModal,
  selectedSubsystemId,
  showArchivedMechanisms,
  subsystemFilterMotionClass,
  handleSubsystemSelection,
}: SubsystemsTableSectionProps) {
  return (
    <div className="panel-subsection subsystem-manager-list" style={{ flex: "1 1 620px" }}>
      <div className="roster-section-header">
        <div className="roster-section-title">
          <h3 style={{ color: "var(--text-title)" }}>Subsystems</h3>
        </div>
      </div>

      <div className={`table-shell subsystem-manager-list-shell ${subsystemFilterMotionClass}`}>
        <div
          className="ops-table ops-table-header subsystem-manager-table-header"
          style={{
            gridTemplateColumns: "minmax(220px, 2.2fr) 1fr 1.1fr 0.8fr 0.8fr 0.8fr",
            borderBottom: "1px solid var(--border-base)",
            color: "var(--text-copy)",
          }}
        >
          <span style={{ textAlign: "left" }}>Subsystem</span>
          <span>Lead</span>
          <span>Mentors</span>
          <span>Mechanisms</span>
          <span>Tasks</span>
          <span>Risks</span>
        </div>

        {filteredSubsystems.map((subsystem) => {
          const counts = countsBySubsystemId[subsystem.id] ?? {
            mechanisms: 0,
            parts: 0,
            tasks: 0,
            openTasks: 0,
          };
          const isSelected = subsystem.id === selectedSubsystemId;
          const mentorNames = subsystem.mentorIds
            .map((mentorId) => membersById[mentorId]?.name ?? "Unknown")
            .join(", ");
          const subsystemDescription = subsystem.description.trim();
          const subsystemMechanisms = getSubsystemMechanisms(
            bootstrap,
            subsystem.id,
            showArchivedMechanisms,
          );
          const accentColor = subsystem.color ?? "var(--meco-blue)";
          const parentSubsystemName = getSubsystemParentName(bootstrap, subsystem.parentSubsystemId);

          return (
            <div
              key={subsystem.id}
              className={`subsystem-manager-item${isSelected ? " is-active" : ""}`}
              data-workspace-color={subsystem.color}
            >
              <div
                className="ops-table ops-row subsystem-manager-row editable-row-clickable editable-action-host editable-hover-target-row"
                onClick={() => handleSubsystemSelection(subsystem.id)}
                onKeyDown={(milestone) => {
                  if (milestone.target !== milestone.currentTarget) {
                    return;
                  }

                  if (milestone.key === "Enter" || milestone.key === " ") {
                    milestone.preventDefault();
                    handleSubsystemSelection(subsystem.id);
                  }
                }}
                role="button"
                aria-expanded={isSelected}
                aria-controls={`subsystem-${subsystem.id}-details`}
                style={{
                  gridTemplateColumns: "minmax(220px, 2.2fr) 1fr 1.1fr 0.8fr 0.8fr 0.8fr",
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border-base)",
                  color: "var(--text-copy)",
                  background: isSelected
                    ? "rgba(22, 71, 142, 0.08)"
                    : "var(--row-bg, var(--bg-row-alt))",
                  textAlign: "left",
                  boxShadow: isSelected
                    ? `inset 4px 0 0 ${accentColor}, inset 0 0 0 1px rgba(22, 71, 142, 0.16)`
                    : `inset 4px 0 0 ${accentColor}`,
                }}
                tabIndex={0}
                title={`Inspect ${subsystem.name}`}
              >
                <TableCell label="Subsystem">
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
                    <span className="subsystem-cell-meta">
                      <strong className="subsystem-cell-title">{subsystem.name}</strong>
                      {subsystem.isArchived ? (
                        <span className="subsystem-cell-description">Archived</span>
                      ) : null}
                      {subsystemDescription ? (
                        <span className="subsystem-cell-description">{subsystemDescription}</span>
                      ) : null}
                      <span className="subsystem-cell-details" aria-label="Subsystem metadata">
                        <small>{formatIterationVersion(subsystem.iteration)}</small>
                        <small>{`Parent: ${parentSubsystemName}`}</small>
                      </span>
                    </span>
                  </span>
                </TableCell>
                <TableCell label="Lead">
                  {formatMemberName(membersById, subsystem.responsibleEngineerId)}
                </TableCell>
                <TableCell label="Mentors">{mentorNames || "Unassigned"}</TableCell>
                <TableCell label="Mechanisms">{counts.mechanisms}</TableCell>
                <TableCell label="Tasks">
                  <strong style={{ color: "var(--text-title)" }}>{counts.openTasks}</strong>
                  <small>{counts.tasks} total</small>
                </TableCell>
                <TableCell label="Risks">{subsystem.risks.length}</TableCell>
                <div className="subsystem-manager-row-actions">
                  <button
                    className="subsystem-manager-action-button subsystem-manager-action-button-primary"
                    data-tutorial-target="create-mechanism-button"
                    disabled={subsystem.isArchived}
                    onClick={(milestone) => {
                      milestone.stopPropagation();
                      openCreateMechanismModal(subsystem.id);
                    }}
                    type="button"
                    aria-label={`Add mechanism to ${subsystem.name}`}
                    title="Add mechanism"
                  >
                    <IconPlus />
                  </button>
                  <button
                    className="subsystem-manager-action-button"
                    data-tutorial-target="edit-subsystem-button"
                    onClick={(milestone) => {
                      milestone.stopPropagation();
                      openEditSubsystemModal(subsystem);
                    }}
                    type="button"
                    aria-label={`Edit ${subsystem.name}`}
                    title="Edit subsystem"
                  >
                    <IconEdit />
                  </button>
                </div>
              </div>

              {isSelected ? (
                <div className="subsystem-manager-expansion" id={`subsystem-${subsystem.id}-details`}>
                  {subsystemMechanisms.length > 0 ? (
                    <div style={{ display: "grid", gap: "0.45rem" }}>
                      {subsystemMechanisms.map((mechanism) => (
                        <div
                          key={mechanism.id}
                          className="summary-chip"
                          style={{ display: "grid", gap: "0.3rem" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: "0.75rem",
                              alignItems: "flex-start",
                            }}
                          >
                            <div style={{ display: "grid", gap: "0.2rem" }}>
                              <strong style={{ color: "var(--text-title)" }}>{mechanism.name}</strong>
                              {mechanism.isArchived ? (
                                <small style={{ color: "var(--text-copy)" }}>Archived</small>
                              ) : null}
                              <small style={{ color: "var(--text-copy)" }}>
                                {formatIterationVersion(mechanism.iteration)} / {mechanism.description}
                              </small>
                            </div>
                            <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                              <button
                                className="subsystem-manager-action-button subsystem-manager-action-button-primary"
                                data-tutorial-target="add-part-to-mechanism-button"
                                onClick={() => openCreatePartInstanceModal(mechanism)}
                                type="button"
                                aria-label={`Add part to ${mechanism.name}`}
                                title="Add part to mechanism"
                              >
                                <IconPlus />
                              </button>
                              <button
                                className="subsystem-manager-action-button"
                                data-tutorial-target="edit-mechanism-button"
                                onClick={() => openEditMechanismModal(mechanism)}
                                type="button"
                                aria-label={`Edit ${mechanism.name}`}
                                title="Edit mechanism"
                              >
                                <IconEdit />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <small style={{ color: "var(--text-copy)" }}>No mechanisms yet.</small>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}

        {filteredSubsystems.length === 0 ? (
          <p className="empty-state">No subsystems match the current search or filters.</p>
        ) : null}
      </div>
    </div>
  );
}
