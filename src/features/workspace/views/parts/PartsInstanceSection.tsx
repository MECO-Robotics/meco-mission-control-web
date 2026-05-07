import type { CSSProperties } from "react";

import { ColumnFilterDropdown } from "@/features/workspace/shared/filters/ColumnFilterDropdown";
import { PaginationControls, TableCell } from "@/features/workspace/shared/table/workspaceTableChrome";
import { getStatusPillClassName } from "@/features/workspace/shared/model/workspaceUtils";
import { PART_STATUS_OPTIONS } from "@/features/workspace/shared/model/workspaceOptions";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { BootstrapPayload } from "@/types/bootstrap";

import { PART_INSTANCE_GRID_TEMPLATE } from "./partsViewTypes";

interface PartsInstanceSectionProps {
  bootstrap: BootstrapPayload;
  filteredPartInstances: BootstrapPayload["partInstances"];
  mechanismsById: Record<string, BootstrapPayload["mechanisms"][number]>;
  partDefinitionsById: Record<string, BootstrapPayload["partDefinitions"][number]>;
  partInstanceFilterMotionClass: string;
  partMechanism: FilterSelection;
  partStatus: FilterSelection;
  partSubsystem: FilterSelection;
  setPartMechanism: (value: FilterSelection) => void;
  setPartStatus: (value: FilterSelection) => void;
  setPartSubsystem: (value: FilterSelection) => void;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
  pageChangeHandlers: {
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    page: number;
    pageSize: number;
    pageSizeOptions: readonly number[];
    rangeEnd: number;
    rangeStart: number;
    totalItems: number;
    totalPages: number;
  };
}

export function PartsInstanceSection({
  bootstrap,
  filteredPartInstances,
  mechanismsById,
  partDefinitionsById,
  partInstanceFilterMotionClass,
  partMechanism,
  partStatus,
  partSubsystem,
  setPartMechanism,
  setPartStatus,
  setPartSubsystem,
  subsystemsById,
  pageChangeHandlers,
}: PartsInstanceSectionProps) {
  return (
    <div className="panel-subsection">
      <div className="roster-section-header">
        <h3>Part instances</h3>
      </div>
      <div className={`table-shell ${partInstanceFilterMotionClass}`}>
        <div
          className="ops-table ops-table-header"
          style={{ "--workspace-grid-template": PART_INSTANCE_GRID_TEMPLATE } as CSSProperties}
        >
          <span>Instance</span>
          <span>Definition</span>
          <span className="table-column-header-cell">
            <span className="table-column-title">Mechanism</span>
            <ColumnFilterDropdown
              allLabel="All mechanisms"
              ariaLabel="Filter parts by mechanism"
              onChange={setPartMechanism}
              options={bootstrap.mechanisms}
              value={partMechanism}
            />
          </span>
          <span className="table-column-header-cell">
            <span className="table-column-title">Subsystem</span>
            <ColumnFilterDropdown
              allLabel="All subsystems"
              ariaLabel="Filter parts by subsystem"
              onChange={setPartSubsystem}
              options={bootstrap.subsystems}
              value={partSubsystem}
            />
          </span>
          <span>Qty</span>
          <span className="table-column-header-cell">
            <span className="table-column-title">Status</span>
            <ColumnFilterDropdown
              allLabel="All statuses"
              ariaLabel="Filter parts by status"
              onChange={setPartStatus}
              options={PART_STATUS_OPTIONS}
              value={partStatus}
            />
          </span>
        </div>
        {filteredPartInstances.map((partInstance) => {
          const trackingSubtitle = partInstance.trackIndividually ? "Individual tracking" : "Bulk quantity";
          const mechanismName = partInstance.mechanismId
            ? mechanismsById[partInstance.mechanismId]?.name ?? "Unknown"
            : "Unassigned";
          const subsystemName =
            (partInstance.subsystemId ? subsystemsById[partInstance.subsystemId]?.name : null) ?? "Unknown";

          return (
            <div
              className="ops-table ops-row"
              key={partInstance.id}
              style={{ "--workspace-grid-template": PART_INSTANCE_GRID_TEMPLATE } as CSSProperties}
            >
              <span
                className="queue-title table-cell table-cell-primary part-instance-primary-cell"
                data-label="Instance"
              >
                <span className="requested-item-meta">
                  <span className="requested-item-title">{partInstance.name}</span>
                  <small className="requested-item-subtitle">{trackingSubtitle}</small>
                </span>
              </span>
              <TableCell label="Definition">
                {partDefinitionsById[partInstance.partDefinitionId]?.name ?? "Unknown part"}
              </TableCell>
              <TableCell label="Mechanism">
                <span className="part-instance-dropdown-chip" title={mechanismName}>
                  <span>{mechanismName}</span>
                </span>
              </TableCell>
              <TableCell label="Subsystem">
                <span className="part-instance-dropdown-chip" title={subsystemName}>
                  <span>{subsystemName}</span>
                </span>
              </TableCell>
              <TableCell label="Qty">{partInstance.quantity}</TableCell>
              <TableCell label="Status" valueClassName="table-cell-pill">
                <span className={getStatusPillClassName(partInstance.status)}>{partInstance.status}</span>
              </TableCell>
            </div>
          );
        })}
        {filteredPartInstances.length === 0 ? (
          <p className="empty-state">No part instances match the current filters.</p>
        ) : null}
        <PaginationControls {...pageChangeHandlers} label="part instances" />
      </div>
    </div>
  );
}
