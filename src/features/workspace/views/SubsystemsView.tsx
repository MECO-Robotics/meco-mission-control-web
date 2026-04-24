import { useMemo, useState } from "react";

import { IconEdit, IconPlus } from "../../../components/shared/Icons";
import type { BootstrapPayload, MechanismRecord, SubsystemRecord } from "../../../types";
import {
  SearchToolbarInput,
  TableCell,
} from "../shared/WorkspaceViewShared";
import { getDefaultSubsystemId } from "../../../lib/appUtils";
import type { MembersById } from "../shared/workspaceTypes";
import { WORKSPACE_PANEL_CLASS } from "../shared/workspaceTypes";

interface SubsystemsViewProps {
  bootstrap: BootstrapPayload;
  membersById: MembersById;
  openCreateMechanismModal: (subsystemId?: string) => void;
  openCreatePartInstanceModal: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  openCreateSubsystemModal: () => void;
  openEditMechanismModal: (mechanism: MechanismRecord) => void;
  openEditPartInstanceModal: (partInstance: BootstrapPayload["partInstances"][number]) => void;
  openEditSubsystemModal: (subsystem: SubsystemRecord) => void;
}

function formatMemberName(membersById: MembersById, memberId: string | null) {
  if (!memberId) {
    return "Unassigned";
  }

  return membersById[memberId]?.name ?? "Unknown";
}

export function SubsystemsView({
  bootstrap,
  membersById,
  openCreateMechanismModal,
  openCreateSubsystemModal,
  openEditMechanismModal,
  openEditSubsystemModal,
}: SubsystemsViewProps) {
  const [search, setSearch] = useState("");
  const [selectedSubsystemId, setSelectedSubsystemId] = useState(
    getDefaultSubsystemId(bootstrap),
  );

  const handleSubsystemSelection = (subsystemId: string) => {
    setSelectedSubsystemId((currentSubsystemId) =>
      currentSubsystemId === subsystemId ? "" : subsystemId,
    );
  };

  const countsBySubsystemId = useMemo(() => {
    const initialCounts = Object.fromEntries(
      bootstrap.subsystems.map((subsystem) => [
        subsystem.id,
        {
          mechanisms: 0,
          openRequirements: 0,
          parts: 0,
          tasks: 0,
          openTasks: 0,
          requirements: 0,
        },
      ]),
    ) as Record<
      string,
      {
        mechanisms: number;
        openRequirements: number;
        parts: number;
        tasks: number;
        openTasks: number;
        requirements: number;
      }
    >;

    for (const mechanism of bootstrap.mechanisms) {
      initialCounts[mechanism.subsystemId] = initialCounts[mechanism.subsystemId] ?? {
        mechanisms: 0,
        openRequirements: 0,
        parts: 0,
        tasks: 0,
        openTasks: 0,
        requirements: 0,
      };
      initialCounts[mechanism.subsystemId].mechanisms += 1;
    }

    for (const requirement of bootstrap.requirements) {
      initialCounts[requirement.subsystemId] = initialCounts[requirement.subsystemId] ?? {
        mechanisms: 0,
        openRequirements: 0,
        parts: 0,
        tasks: 0,
        openTasks: 0,
        requirements: 0,
      };
      initialCounts[requirement.subsystemId].requirements += 1;
      if (requirement.status !== "complete") {
        initialCounts[requirement.subsystemId].openRequirements += 1;
      }
    }

    for (const partInstance of bootstrap.partInstances) {
      initialCounts[partInstance.subsystemId] = initialCounts[partInstance.subsystemId] ?? {
        mechanisms: 0,
        openRequirements: 0,
        parts: 0,
        tasks: 0,
        openTasks: 0,
        requirements: 0,
      };
      initialCounts[partInstance.subsystemId].parts += 1;
    }

    for (const task of bootstrap.tasks) {
      initialCounts[task.subsystemId] = initialCounts[task.subsystemId] ?? {
        mechanisms: 0,
        openRequirements: 0,
        parts: 0,
        tasks: 0,
        openTasks: 0,
        requirements: 0,
      };
      initialCounts[task.subsystemId].tasks += 1;
      if (task.status !== "complete") {
        initialCounts[task.subsystemId].openTasks += 1;
      }
    }

    return initialCounts;
  }, [bootstrap.mechanisms, bootstrap.partInstances, bootstrap.requirements, bootstrap.subsystems, bootstrap.tasks]);

  const partDefinitionsById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.partDefinitions.map((partDefinition) => [partDefinition.id, partDefinition]),
      ) as Record<string, BootstrapPayload["partDefinitions"][number]>,
    [bootstrap.partDefinitions],
  );


  const filteredSubsystems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...bootstrap.subsystems].filter((subsystem) => {
      const parentSubsystem = subsystem.parentSubsystemId
        ? bootstrap.subsystems.find((candidate) => candidate.id === subsystem.parentSubsystemId)
        : null;
      const relatedMechanisms = bootstrap.mechanisms
        .filter((mechanism) => mechanism.subsystemId === subsystem.id)
        .map((mechanism) => mechanism.name)
        .join(" ");
      const relatedTasks = bootstrap.tasks
        .filter((task) => task.subsystemId === subsystem.id)
        .map((task) => `${task.title} ${task.summary}`)
        .join(" ");
      const relatedPartInstances = bootstrap.partInstances
        .filter((partInstance) => partInstance.subsystemId === subsystem.id)
        .map((partInstance) => {
          const partDefinition = partDefinitionsById[partInstance.partDefinitionId];
          return `${partInstance.name} ${partDefinition?.name ?? ""}`;
        })
        .join(" ");
      const relatedRisks = subsystem.risks.join(" ");
      const responsibleEngineer = formatMemberName(
        membersById,
        subsystem.responsibleEngineerId,
      );
      const mentorNames = subsystem.mentorIds
        .map((mentorId) => membersById[mentorId]?.name ?? "")
        .join(" ");
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          subsystem.name,
          subsystem.description,
          parentSubsystem?.name ?? "",
          responsibleEngineer,
          mentorNames,
          relatedMechanisms,
          relatedTasks,
          relatedPartInstances,
          relatedRisks,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesSearch;
    });
  }, [
    bootstrap.mechanisms,
    bootstrap.partInstances,
    bootstrap.subsystems,
    bootstrap.tasks,
    membersById,
    partDefinitionsById,
    search,
  ]);

  const selectedSubsystem =
    filteredSubsystems.find((subsystem) => subsystem.id === selectedSubsystemId) ?? null;

  const filteredMechanisms = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...bootstrap.mechanisms]
      .filter((mechanism) => {
        const subsystem = bootstrap.subsystems.find(
          (candidate) => candidate.id === mechanism.subsystemId,
        );
        if (!subsystem) {
          return false;
        }

        const relatedPartInstances = bootstrap.partInstances
          .filter((partInstance) => partInstance.mechanismId === mechanism.id)
          .map((partInstance) => {
            const partDefinition = partDefinitionsById[partInstance.partDefinitionId];
            return `${partInstance.name} ${partDefinition?.name ?? ""}`;
          })
          .join(" ");
        const matchesSearch =
          normalizedSearch.length === 0 ||
          [
            mechanism.name,
            mechanism.description,
            subsystem.name,
            relatedPartInstances,
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch);

        return matchesSearch;
      })
      .sort((left, right) => {
        const leftSubsystem = bootstrap.subsystems.find((subsystem) => subsystem.id === left.subsystemId);
        const rightSubsystem = bootstrap.subsystems.find((subsystem) => subsystem.id === right.subsystemId);
        const leftName = `${leftSubsystem?.name ?? ""} ${left.name}`.toLowerCase();
        const rightName = `${rightSubsystem?.name ?? ""} ${right.name}`.toLowerCase();
        return leftName.localeCompare(rightName);
      });
  }, [bootstrap.mechanisms, bootstrap.partInstances, bootstrap.subsystems, partDefinitionsById, search]);

  const visibleSubsystemCount = filteredSubsystems.length;
  const visibleMechanismCount = filteredMechanisms.length;
  const visibleOpenRequirementCount = filteredSubsystems.reduce(
    (total, subsystem) => total + (countsBySubsystemId[subsystem.id]?.openRequirements ?? 0),
    0,
  );

  return (
    <section className={`panel dense-panel subsystem-manager-shell ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2 style={{ color: "var(--text-title)" }}>Subsystem manager</h2>
          <p className="section-copy filter-copy" style={{ color: "var(--text-copy)" }}>
            Review subsystem ownership, risk, and mechanism coverage in one place.
          </p>
        </div>
        <div className="panel-actions filter-toolbar subsystem-manager-toolbar">
          <SearchToolbarInput
            ariaLabel="Search subsystems and mechanisms"
            onChange={setSearch}
            placeholder="Search subsystems or mechanisms..."
            value={search}
          />

          <button
            aria-label="Add subsystem"
            className="primary-action subsystem-manager-toolbar-action"
            onClick={openCreateSubsystemModal}
            type="button"
          >
            Add subsystem
          </button>
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
          <span>Visible subsystems</span>
          <strong>{visibleSubsystemCount}</strong>
        </div>
        <div className="summary-chip">
          <span>Visible mechanisms</span>
          <strong>{visibleMechanismCount}</strong>
        </div>
        <div className="summary-chip">
          <span>Open requirements</span>
          <strong>{visibleOpenRequirementCount}</strong>
        </div>
      </div>

      <div className="panel-subsection subsystem-manager-list" style={{ flex: "1 1 620px" }}>
        <div className="roster-section-header">
          <div className="roster-section-title">
            <h3 style={{ color: "var(--text-title)" }}>Subsystems</h3>
          </div>
        </div>

        <div className="table-shell subsystem-manager-list-shell">
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
              openRequirements: 0,
              parts: 0,
              tasks: 0,
              openTasks: 0,
              requirements: 0,
            };
            const isSelected = subsystem.id === selectedSubsystem?.id;
            const mentorNames = subsystem.mentorIds
              .map((mentorId) => membersById[mentorId]?.name ?? "Unknown")
              .join(", ");
            const parentSubsystem = subsystem.parentSubsystemId
              ? bootstrap.subsystems.find(
                  (candidate) => candidate.id === subsystem.parentSubsystemId,
                )
              : null;
            const subsystemMechanisms = [...bootstrap.mechanisms]
              .filter((mechanism) => mechanism.subsystemId === subsystem.id)
              .sort((left, right) => left.name.localeCompare(right.name));

            return (
              <div
                key={subsystem.id}
                className={`subsystem-manager-item${isSelected ? " is-active" : ""}`}
              >
                <div
                  className="ops-table ops-row subsystem-manager-row editable-row-clickable editable-action-host editable-hover-target-row"
                  onClick={() => handleSubsystemSelection(subsystem.id)}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) {
                      return;
                    }

                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
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
                    background: isSelected ? "rgba(22, 71, 142, 0.08)" : "var(--row-bg, var(--bg-row-alt))",
                    textAlign: "left",
                    boxShadow: isSelected ? "inset 0 0 0 1px rgba(22, 71, 142, 0.16)" : undefined,
                  }}
                  tabIndex={0}
                  title={`Inspect ${subsystem.name}`}
                >
                  <TableCell label="Subsystem">
                    <strong style={{ color: "var(--text-title)" }}>{subsystem.name}</strong>
                    <small style={{ color: "var(--text-copy)" }}>{subsystem.description}</small>
                    <small style={{ color: "var(--text-copy)" }}>
                      {subsystem.parentSubsystemId
                        ? `Parent: ${parentSubsystem?.name ?? "Unknown"}`
                        : "Parent: Drivetrain root"}
                    </small>
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
                      onClick={(event) => {
                        event.stopPropagation();
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
                      onClick={(event) => {
                        event.stopPropagation();
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
                                <small style={{ color: "var(--text-copy)" }}>
                                  {mechanism.description}
                                </small>
                              </div>
                              <button
                                className="subsystem-manager-action-button"
                                onClick={() => openEditMechanismModal(mechanism)}
                                type="button"
                                aria-label={`Edit ${mechanism.name}`}
                                title="Edit mechanism"
                              >
                                <IconEdit />
                              </button>
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
            <p className="empty-state">
              No subsystems match the current search or scope.
            </p>
          ) : null}
        </div>
      </div>

    </section>
  );
}
