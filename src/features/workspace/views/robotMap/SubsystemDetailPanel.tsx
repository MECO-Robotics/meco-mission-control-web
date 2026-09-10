import { IconEdit } from "@/components/shared/Icons";
import type { NavigationTarget } from "@/lib/workspaceNavigation";
import type { PartInstanceRecord } from "@/types/recordsInventory";
import type { MechanismRecord, SubsystemRecord } from "@/types/recordsOrganization";

import { CadSourceBadge } from "./CadSourceBadge";
import { SubsystemMechanismSection } from "./SubsystemMechanismSection";
import type {
  RobotConfigurationDrilldownLinkModel,
  RobotConfigurationSubsystemModel,
} from "./robotMapViewModel";

interface DrilldownGroup {
  emptyLabel: string;
  items: RobotConfigurationDrilldownLinkModel[];
  label: string;
  target: NavigationTarget;
}

interface SubsystemDetailPanelProps {
  onCreateMechanism: (subsystemId?: string) => void;
  onCreatePartInstance: (mechanism: MechanismRecord) => void;
  onDeleteMechanism: (mechanismId: string) => Promise<void>;
  onEditMechanism: (mechanism: MechanismRecord) => void;
  onEditPartInstance: (partInstance: PartInstanceRecord) => void;
  onEditSubsystem: (subsystem: SubsystemRecord) => void;
  onOpenDrilldownTarget?: (target: NavigationTarget) => void;
  onRemovePartFromMechanism: (partInstanceId: string) => Promise<boolean>;
  onSaveSubsystemConfiguration: (
    subsystemId: string,
    patch: Partial<
      Pick<
        SubsystemRecord,
        "name" | "description" | "layoutX" | "layoutY" | "layoutZone" | "layoutView" | "sortOrder"
      >
    >,
  ) => Promise<boolean>;
  selectedSubsystem: RobotConfigurationSubsystemModel | null;
}

function SubsystemDrilldownGroup({
  emptyLabel,
  items,
  label,
  onOpenDrilldownTarget,
  target,
}: DrilldownGroup & {
  onOpenDrilldownTarget?: (target: NavigationTarget) => void;
}) {
  return (
    <div className="robot-config-drilldown-group">
      <div className="robot-config-drilldown-group-header">
        <h5>{label}</h5>
        <small>{items.length}</small>
      </div>
      {items.length > 0 ? (
        <>
          <button
            className="robot-config-drilldown-link"
            onClick={() => onOpenDrilldownTarget?.(target)}
            type="button"
          >
            Open {label.toLowerCase()}
          </button>
          <ul className="robot-config-drilldown-list">
            {items.map((item) => (
              <li className="robot-config-drilldown-row" key={item.id}>
                <span>{item.label}</span>
                <small>{item.meta}</small>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="empty-state">{emptyLabel}</p>
      )}
    </div>
  );
}

export function SubsystemDetailPanel({
  onCreateMechanism,
  onCreatePartInstance,
  onDeleteMechanism,
  onEditMechanism,
  onEditPartInstance,
  onEditSubsystem,
  onOpenDrilldownTarget,
  onRemovePartFromMechanism,
  selectedSubsystem,
}: SubsystemDetailPanelProps) {
  if (!selectedSubsystem) {
    return (
      <aside className="robot-config-detail-panel">
        <h3>Subsystem Details</h3>
        <p className="empty-state">Select a subsystem to configure mechanisms and parts.</p>
      </aside>
    );
  }

  const drilldownGroups: DrilldownGroup[] = [
    {
      emptyLabel: "No linked mechanisms yet.",
      items: selectedSubsystem.linkedMechanisms,
      label: "Linked mechanisms",
      target: { tab: "subsystems" },
    },
    {
      emptyLabel: "No linked parts yet.",
      items: selectedSubsystem.linkedParts,
      label: "Linked parts",
      target: { tab: "inventory", inventoryView: "parts" },
    },
    {
      emptyLabel: "No linked tasks yet.",
      items: selectedSubsystem.linkedTasks,
      label: "Linked tasks",
      target: { tab: "tasks", taskView: "queue" },
    },
    {
      emptyLabel: "No linked risks yet.",
      items: selectedSubsystem.linkedRisks,
      label: "Linked risks",
      target: { tab: "risk-management", riskManagementView: "kanban" },
    },
    {
      emptyLabel: "No linked worklogs yet.",
      items: selectedSubsystem.linkedWorkLogs,
      label: "Linked worklogs",
      target: { tab: "worklogs", worklogsView: "logs" },
    },
    {
      emptyLabel: "No linked manufacturing items yet.",
      items: selectedSubsystem.linkedManufacturingItems,
      label: "Linked manufacturing",
      target: { tab: "manufacturing", manufacturingView: "all" },
    },
  ];

  return (
    <aside className="robot-config-detail-panel">
      <header className="robot-config-detail-header">
        <div className="robot-config-detail-title-row">
          <h3>{selectedSubsystem.name}</h3>
          <button
            aria-label="Edit subsystem"
            className="icon-button robot-config-detail-title-edit"
            onClick={() => onEditSubsystem(selectedSubsystem.record)}
            title="Edit subsystem"
            type="button"
          >
            <IconEdit />
          </button>
        </div>
        <div className="robot-config-detail-meta-row">
          <small>{`${selectedSubsystem.mechanismCount} mechanisms | ${selectedSubsystem.partCount} parts`}</small>
          <CadSourceBadge source={selectedSubsystem.cadSource} />
        </div>
      </header>

      <section className="robot-config-detail-readonly">
        <h4>Description</h4>
        <p className="section-copy">{selectedSubsystem.description || "No description yet."}</p>
      </section>

      <section className="robot-config-detail-drilldowns" aria-label="Subsystem drilldown links">
        <h4>Drilldowns</h4>
        <div className="robot-config-drilldown-grid">
          {drilldownGroups.map((group) => (
            <SubsystemDrilldownGroup
              key={group.label}
              emptyLabel={group.emptyLabel}
              items={group.items}
              label={group.label}
              onOpenDrilldownTarget={onOpenDrilldownTarget}
              target={group.target}
            />
          ))}
        </div>
      </section>

      <SubsystemMechanismSection
        mechanisms={selectedSubsystem.mechanisms}
        onCreateMechanism={() => onCreateMechanism(selectedSubsystem.id)}
        onCreatePartInstance={onCreatePartInstance}
        onDeleteMechanism={onDeleteMechanism}
        onEditMechanism={onEditMechanism}
        onEditPartInstance={onEditPartInstance}
        onRemovePartFromMechanism={onRemovePartFromMechanism}
      />
    </aside>
  );
}
