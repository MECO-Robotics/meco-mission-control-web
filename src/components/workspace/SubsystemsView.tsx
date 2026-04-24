import { useMemo, useState } from "react";

import { IconSubsystems } from "../shared/Icons";
import type { BootstrapPayload, MechanismRecord, SubsystemRecord } from "../../types";
import { getStatusPillClassName } from "./workspaceUtils";
import {
  EditableHoverIndicator,
  FilterDropdown,
  SearchToolbarInput,
  TableCell,
} from "./WorkspaceViewShared";
import type { MembersById } from "./workspaceTypes";
import { WORKSPACE_PANEL_CLASS } from "./workspaceTypes";
import type { DropdownOption } from "./workspaceTypes";

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

const SUBSYSTEM_SCOPE_OPTIONS: DropdownOption[] = [
  { id: "core", name: "Core systems" },
  { id: "support", name: "Support systems" },
];

function formatMemberName(membersById: MembersById, memberId: string | null) {
  if (!memberId) {
    return "Unassigned";
  }

  return membersById[memberId]?.name ?? "Unknown";
}

function buildSubtext(values: string[]) {
  return values.filter(Boolean).join(" · ");
}

export function SubsystemsView({
  bootstrap,
  membersById,
  openCreateMechanismModal,
  openCreatePartInstanceModal,
  openCreateSubsystemModal,
  openEditMechanismModal,
  openEditPartInstanceModal,
  openEditSubsystemModal,
}: SubsystemsViewProps) {
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("all");
  const [selectedSubsystemId, setSelectedSubsystemId] = useState(
    bootstrap.subsystems[0]?.id ?? "",
  );

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

  const mechanismStatsById = useMemo(() => {
    const initialStats = Object.fromEntries(
      bootstrap.mechanisms.map((mechanism) => [
        mechanism.id,
        {
          tasks: 0,
          openTasks: 0,
          partInstances: [] as BootstrapPayload["partInstances"],
        },
      ]),
    ) as Record<
      string,
      {
        tasks: number;
        openTasks: number;
        partInstances: BootstrapPayload["partInstances"];
      }
    >;

    for (const task of bootstrap.tasks) {
      if (!task.mechanismId) {
        continue;
      }

      initialStats[task.mechanismId] = initialStats[task.mechanismId] ?? {
        tasks: 0,
        openTasks: 0,
        partInstances: [],
      };
      initialStats[task.mechanismId].tasks += 1;
      if (task.status !== "complete") {
        initialStats[task.mechanismId].openTasks += 1;
      }
    }

    for (const partInstance of bootstrap.partInstances) {
      if (!partInstance.mechanismId) {
        continue;
      }

      initialStats[partInstance.mechanismId] = initialStats[partInstance.mechanismId] ?? {
        tasks: 0,
        openTasks: 0,
        partInstances: [],
      };
      initialStats[partInstance.mechanismId].partInstances.push(partInstance);
    }

    for (const mechanismId of Object.keys(initialStats)) {
      initialStats[mechanismId].partInstances = [...initialStats[mechanismId].partInstances].sort(
        (left, right) => left.name.localeCompare(right.name),
      );
    }

    return initialStats;
  }, [bootstrap.mechanisms, bootstrap.partInstances, bootstrap.tasks]);

  const filteredSubsystems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...bootstrap.subsystems].filter((subsystem) => {
      const matchesScope =
        scope === "all" ||
        (scope === "core" ? subsystem.isCore : !subsystem.isCore);
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

      return matchesScope && matchesSearch;
    });
  }, [
    bootstrap.mechanisms,
    bootstrap.partInstances,
    bootstrap.subsystems,
    bootstrap.tasks,
    membersById,
    partDefinitionsById,
    scope,
    search,
  ]);
  const selectedSubsystem =
    filteredSubsystems.find((subsystem) => subsystem.id === selectedSubsystemId) ??
    filteredSubsystems[0] ??
    null;

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

        const matchesScope =
          scope === "all" ||
          (scope === "core" ? subsystem.isCore : !subsystem.isCore);
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

        return matchesScope && matchesSearch;
      })
      .sort((left, right) => {
        const leftSubsystem = bootstrap.subsystems.find((subsystem) => subsystem.id === left.subsystemId);
        const rightSubsystem = bootstrap.subsystems.find((subsystem) => subsystem.id === right.subsystemId);
        const leftName = `${leftSubsystem?.name ?? ""} ${left.name}`.toLowerCase();
        const rightName = `${rightSubsystem?.name ?? ""} ${right.name}`.toLowerCase();
        return leftName.localeCompare(rightName);
      });
  }, [bootstrap.mechanisms, bootstrap.partInstances, bootstrap.subsystems, partDefinitionsById, scope, search]);

  const visibleSubsystemCount = filteredSubsystems.length;
  const visibleMechanismCount = filteredMechanisms.length;
  const visibleCoreCount = filteredSubsystems.filter((subsystem) => subsystem.isCore).length;
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

          <FilterDropdown
            allLabel="All systems"
            ariaLabel="Filter subsystem scope"
            icon={<IconSubsystems />}
            onChange={setScope}
            options={SUBSYSTEM_SCOPE_OPTIONS}
            value={scope}
          />

          <button
            aria-label="Add subsystem"
            className="secondary-action subsystem-manager-toolbar-action"
            onClick={openCreateSubsystemModal}
            type="button"
          >
            Add subsystem
          </button>

          <button
            aria-label="Add mechanism"
            className="primary-action subsystem-manager-toolbar-action"
            onClick={() => openCreateMechanismModal(selectedSubsystem?.id)}
            type="button"
            disabled={bootstrap.subsystems.length === 0}
          >
            Add mechanism
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
          <span>Core systems</span>
          <strong>{visibleCoreCount}</strong>
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

      <div className="roster-columns subsystem-manager-columns">
        <div className="panel-subsection subsystem-manager-list" style={{ flex: "1 1 620px" }}>
          <div className="roster-section-header">
            <div className="roster-section-title">
              <h3 style={{ color: "var(--text-title)" }}>Subsystems</h3>
            </div>
          </div>

          <div className="table-shell">
            <div
              className="ops-table ops-table-header"
              style={{
                gridTemplateColumns: "minmax(220px, 2.2fr) 1fr 1.1fr 0.8fr 0.8fr 0.8fr 0.9fr",
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
              <span>Type</span>
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

              return (
                <button
                  className="ops-table ops-row"
                  key={subsystem.id}
                  onClick={() => setSelectedSubsystemId(subsystem.id)}
                  style={{
                    gridTemplateColumns: "minmax(220px, 2.2fr) 1fr 1.1fr 0.8fr 0.8fr 0.8fr 0.9fr",
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border-base)",
                    color: "var(--text-copy)",
                    background: isSelected ? "rgba(22, 71, 142, 0.08)" : "var(--bg-row-alt)",
                    textAlign: "left",
                    boxShadow: isSelected ? "inset 0 0 0 1px rgba(22, 71, 142, 0.16)" : undefined,
                  }}
                  title={`Inspect ${subsystem.name}`}
                  type="button"
                >
                  <TableCell label="Subsystem">
                    <strong style={{ color: "var(--text-title)" }}>{subsystem.name}</strong>
                    <small style={{ color: "var(--text-copy)" }}>{subsystem.description}</small>
                  </TableCell>
                  <TableCell label="Lead">
                    {formatMemberName(membersById, subsystem.responsibleEngineerId)}
                  </TableCell>
                  <TableCell label="Mentors">{mentorNames || "Unassigned"}</TableCell>
                  <TableCell label="Mechanisms">
                    {counts.mechanisms}
                  </TableCell>
                  <TableCell label="Tasks">
                    <strong style={{ color: "var(--text-title)" }}>{counts.openTasks}</strong>
                    <small>{counts.tasks} total</small>
                  </TableCell>
                  <TableCell label="Risks">
                    {subsystem.risks.length}
                  </TableCell>
                  <TableCell label="Type" valueClassName="table-cell-pill">
                <span className={getStatusPillClassName(subsystem.isCore ? "complete" : "in-progress")}>
                      {subsystem.isCore ? "Core" : "Support"}
                    </span>
                  </TableCell>
                </button>
              );
            })}

            {filteredSubsystems.length === 0 ? (
              <p className="empty-state">
                No subsystems match the current search or scope.
              </p>
            ) : null}
          </div>
        </div>

        <div className="panel-subsection subsystem-manager-detail" style={{ flex: "0 1 360px" }}>
          <div className="roster-section-header">
            <div className="roster-section-title">
              <h3 style={{ color: "var(--text-title)" }}>Focus detail</h3>
            </div>
            {selectedSubsystem ? (
              <button
                className="secondary-action"
                onClick={() => openEditSubsystemModal(selectedSubsystem)}
                type="button"
              >
                Edit subsystem
              </button>
            ) : null}
          </div>

          {selectedSubsystem ? (
            <div
              className="panel"
              style={{
                display: "grid",
                gap: "0.85rem",
                border: "1px solid var(--border-base)",
                background: "var(--bg-row-alt)",
              }}
            >
              <div style={{ display: "grid", gap: "0.35rem" }}>
                <p className="eyebrow" style={{ color: "var(--meco-blue)", marginBottom: 0 }}>
                  Selected subsystem
                </p>
                <h4 style={{ margin: 0, color: "var(--text-title)" }}>{selectedSubsystem.name}</h4>
                <p className="section-copy" style={{ color: "var(--text-copy)" }}>
                  {selectedSubsystem.description}
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "0.5rem",
                  gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))",
                }}
              >
                <div className="summary-chip">
                  <span>Mechanisms</span>
                  <strong>{countsBySubsystemId[selectedSubsystem.id]?.mechanisms ?? 0}</strong>
                </div>
                <div className="summary-chip">
                  <span>Open tasks</span>
                  <strong>{countsBySubsystemId[selectedSubsystem.id]?.openTasks ?? 0}</strong>
                </div>
                <div className="summary-chip">
                  <span>Requirements</span>
                  <strong>{countsBySubsystemId[selectedSubsystem.id]?.requirements ?? 0}</strong>
                </div>
                <div className="summary-chip">
                  <span>Parts</span>
                  <strong>{countsBySubsystemId[selectedSubsystem.id]?.parts ?? 0}</strong>
                </div>
              </div>

              <div style={{ display: "grid", gap: "0.5rem" }}>
              <span className={getStatusPillClassName(selectedSubsystem.isCore ? "complete" : "in-progress")}>
                  {selectedSubsystem.isCore ? "Core system" : "Support system"}
                </span>
                <small style={{ color: "var(--text-copy)" }}>
                  <strong style={{ color: "var(--text-title)" }}>Responsible engineer:</strong>{" "}
                  {formatMemberName(membersById, selectedSubsystem.responsibleEngineerId)}
                </small>
                <small style={{ color: "var(--text-copy)" }}>
                  <strong style={{ color: "var(--text-title)" }}>Mentors:</strong>{" "}
                  {selectedSubsystem.mentorIds
                    .map((mentorId) => membersById[mentorId]?.name ?? "Unknown")
                    .join(", ") || "Unassigned"}
                </small>
              </div>

              <div style={{ display: "grid", gap: "0.55rem" }}>
                <div className="roster-section-header" style={{ minHeight: "auto" }}>
                  <h4 style={{ margin: 0, color: "var(--text-title)", fontSize: "0.98rem" }}>
                    Mechanisms in this subsystem
                  </h4>
                </div>

                {bootstrap.mechanisms
                  .filter((mechanism) => mechanism.subsystemId === selectedSubsystem.id)
                  .map((mechanism) => {
                    const mechanismStats = mechanismStatsById[mechanism.id] ?? {
                      tasks: 0,
                      openTasks: 0,
                      partInstances: [],
                    };

                    return (
                      <div
                        key={mechanism.id}
                        className="summary-chip"
                        style={{ display: "grid", gap: "0.65rem", alignItems: "start" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "0.75rem",
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                          }}
                        >
                          <div style={{ display: "grid", gap: "0.2rem" }}>
                            <strong style={{ color: "var(--text-title)" }}>{mechanism.name}</strong>
                            <small style={{ color: "var(--text-copy)" }}>
                              {mechanism.description}
                            </small>
                          </div>
                          <button
                            className="secondary-action"
                            onClick={() => openEditMechanismModal(mechanism)}
                            type="button"
                          >
                            Edit mechanism
                          </button>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gap: "0.45rem",
                            gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))",
                            alignItems: "stretch",
                          }}
                        >
                          <div className="summary-chip">
                            <span>Tasks</span>
                            <strong>{mechanismStats.openTasks}</strong>
                            <small>{mechanismStats.tasks} total</small>
                          </div>
                          <div className="summary-chip">
                            <span>Part instances</span>
                            <strong>{mechanismStats.partInstances.length}</strong>
                            <small>Owned here</small>
                          </div>
                          <button
                            className="primary-action"
                            onClick={() => openCreatePartInstanceModal(mechanism)}
                            type="button"
                          >
                            Add part instance
                          </button>
                        </div>

                        {mechanismStats.partInstances.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
                            {mechanismStats.partInstances.map((partInstance) => {
                              const partDefinition = partDefinitionsById[partInstance.partDefinitionId];

                              return (
                                <button
                                  key={partInstance.id}
                                  className="secondary-action"
                                  onClick={() => openEditPartInstanceModal(partInstance)}
                                  type="button"
                                  style={{ display: "grid", gap: "0.15rem", textAlign: "left" }}
                                >
                                  <span style={{ color: "var(--text-title)" }}>
                                    {partInstance.name}
                                  </span>
                                  <small style={{ color: "var(--text-copy)" }}>
                                    {partDefinition?.name ?? "Unknown part"} · {partInstance.status}
                                  </small>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <small style={{ color: "var(--text-copy)" }}>No part instances yet.</small>
                        )}
                      </div>
                    );
                  })}

                {bootstrap.mechanisms.filter(
                  (mechanism) => mechanism.subsystemId === selectedSubsystem.id,
                ).length === 0 ? (
                  <small style={{ color: "var(--text-copy)" }}>No mechanisms yet.</small>
                ) : null}
              </div>

              <div style={{ display: "grid", gap: "0.4rem" }}>
                <div className="roster-section-header" style={{ minHeight: "auto" }}>
                  <h4 style={{ margin: 0, color: "var(--text-title)", fontSize: "0.98rem" }}>
                    Open requirements and risks
                  </h4>
                </div>
                <div style={{ display: "grid", gap: "0.4rem" }}>
                  {bootstrap.requirements
                    .filter((requirement) => requirement.subsystemId === selectedSubsystem.id)
                    .slice(0, 3)
                    .map((requirement) => (
                      <div
                        key={requirement.id}
                        className="summary-chip"
                        style={{ display: "grid", gap: "0.2rem" }}
                      >
                        <span>{requirement.title}</span>
                        <strong style={{ fontSize: "0.82rem" }}>
                <span className={getStatusPillClassName(requirement.status)}>
                            {requirement.status}
                          </span>
                        </strong>
                      </div>
                    ))}
                  {bootstrap.requirements.filter(
                    (requirement) => requirement.subsystemId === selectedSubsystem.id,
                  ).length === 0 ? (
                    <small style={{ color: "var(--text-copy)" }}>No linked requirements.</small>
                  ) : null}
                </div>

                {selectedSubsystem.risks.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {selectedSubsystem.risks.map((risk) => (
                      <span
                        key={risk}
                        className="pill"
                        style={{
                          background: "rgba(234, 28, 45, 0.1)",
                          color: "var(--official-red)",
                        }}
                      >
                        {risk}
                      </span>
                    ))}
                  </div>
                ) : (
                  <small style={{ color: "var(--text-copy)" }}>No active risks recorded.</small>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  className="secondary-action"
                  onClick={openCreateSubsystemModal}
                  type="button"
                >
                  Add subsystem
                </button>
                <button
                  className="primary-action"
                  onClick={() => openCreateMechanismModal(selectedSubsystem.id)}
                  type="button"
                >
                  Add mechanism
                </button>
              </div>
            </div>
          ) : (
            <p className="empty-state">
              No subsystem matches the current search. Clear filters to inspect the full set.
            </p>
          )}
        </div>
      </div>

      <div className="panel-subsection">
        <div className="roster-section-header">
          <div className="roster-section-title">
            <h3 style={{ color: "var(--text-title)" }}>Mechanisms</h3>
          </div>
        </div>

        <div className="table-shell">
          <div
            className="ops-table ops-table-header"
            style={{
              gridTemplateColumns: "minmax(200px, 2fr) 1fr 0.8fr 0.8fr 1.6fr auto",
              borderBottom: "1px solid var(--border-base)",
              color: "var(--text-copy)",
            }}
          >
            <span style={{ textAlign: "left" }}>Mechanism</span>
            <span>Subsystem</span>
            <span>Tasks</span>
            <span>Parts</span>
            <span>Description</span>
            <span>Actions</span>
          </div>

          {filteredMechanisms.map((mechanism) => {
            const subsystem = bootstrap.subsystems.find(
              (candidate) => candidate.id === mechanism.subsystemId,
            );
            const counts = mechanismStatsById[mechanism.id] ?? {
              tasks: 0,
              openTasks: 0,
              partInstances: [],
            };
            const isSelectedSubsystem = mechanism.subsystemId === selectedSubsystem?.id;

            return (
              <button
                className="ops-table ops-row editable-action-host editable-hover-target editable-hover-target-row"
                key={mechanism.id}
                onClick={() => openEditMechanismModal(mechanism)}
                style={{
                  gridTemplateColumns: "minmax(200px, 2fr) 1fr 0.8fr 0.8fr 1.6fr auto",
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border-base)",
                  color: "var(--text-copy)",
                  background: isSelectedSubsystem ? "rgba(22, 71, 142, 0.08)" : "var(--bg-row-alt)",
                  textAlign: "left",
                }}
                title={`Edit ${mechanism.name}`}
                type="button"
              >
                <TableCell label="Mechanism">
                  <strong style={{ color: "var(--text-title)" }}>{mechanism.name}</strong>
                  <small style={{ color: "var(--text-copy)" }}>{mechanism.description}</small>
                </TableCell>
                <TableCell label="Subsystem">
                  {subsystem?.name ?? "Unknown"}
                </TableCell>
                <TableCell label="Tasks">
                  <strong style={{ color: "var(--text-title)" }}>{counts.openTasks}</strong>
                  <small>{counts.tasks} total</small>
                </TableCell>
                <TableCell label="Parts">
                  <strong style={{ color: "var(--text-title)" }}>{counts.partInstances.length}</strong>
                  <small>{counts.partInstances.length} total</small>
                </TableCell>
                <TableCell label="Description">
                  {buildSubtext([
                    subsystem?.isCore ? "Core system" : "Support system",
                    subsystem?.responsibleEngineerId
                      ? formatMemberName(membersById, subsystem.responsibleEngineerId)
                      : "Unassigned",
                  ])}
                </TableCell>
                <TableCell label="Actions" valueClassName="table-cell-actions">
                  <EditableHoverIndicator className="editable-hover-indicator-inline" />
                </TableCell>
              </button>
            );
          })}

          {filteredMechanisms.length === 0 ? (
            <p className="empty-state">No mechanisms match the current search or scope.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
