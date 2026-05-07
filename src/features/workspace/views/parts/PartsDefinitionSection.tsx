import type { CSSProperties } from "react";

import { EditableHoverIndicator, PaginationControls, TableCell } from "@/features/workspace/shared/table/workspaceTableChrome";
import { formatIterationVersion } from "@/lib/appUtils/common";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { PartDefinitionRecord } from "@/types/recordsInventory";

import { PART_DEFINITION_GRID_TEMPLATE } from "./partsViewTypes";

interface PartsDefinitionSectionProps {
  bootstrap: BootstrapPayload;
  filteredPartDefinitions: BootstrapPayload["partDefinitions"];
  onEditPartDefinition: (partDefinition: PartDefinitionRecord) => void;
  partDefinitionFilterMotionClass: string;
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

export function PartsDefinitionSection({
  bootstrap,
  filteredPartDefinitions,
  onEditPartDefinition,
  partDefinitionFilterMotionClass,
  pageChangeHandlers,
}: PartsDefinitionSectionProps) {
  return (
    <div className="panel-subsection">
      <div className={`table-shell ${partDefinitionFilterMotionClass}`}>
        <div
          className="ops-table ops-table-header"
          style={{ "--workspace-grid-template": PART_DEFINITION_GRID_TEMPLATE } as CSSProperties}
        >
          <span>Part</span>
          <span>Number</span>
          <span>Rev</span>
          <span>Iter</span>
          <span>Type</span>
          <span>Material</span>
        </div>
        {filteredPartDefinitions.map((partDefinition) => {
          const materialName =
            (partDefinition.materialId
              ? bootstrap.materials.find((material) => material.id === partDefinition.materialId)?.name
              : null) ?? "Unassigned";
          const partSubtitle =
            partDefinition.description.trim().length > 0
              ? partDefinition.description
              : `Source: ${partDefinition.source} | Material: ${materialName}`;

          return (
            <div
              className="ops-table ops-row editable-row-clickable editable-hover-target editable-hover-target-row"
              key={partDefinition.id}
              onClick={() => onEditPartDefinition(partDefinition)}
              onKeyDown={(milestone) => {
                if (milestone.target !== milestone.currentTarget) {
                  return;
                }
                if (milestone.key === "Enter" || milestone.key === " ") {
                  milestone.preventDefault();
                  onEditPartDefinition(partDefinition);
                }
              }}
              role="button"
              tabIndex={0}
              style={{ "--workspace-grid-template": PART_DEFINITION_GRID_TEMPLATE } as CSSProperties}
              title={`Edit ${partDefinition.name}`}
            >
              <span
                className="queue-title table-cell table-cell-primary part-primary-cell"
                data-label="Part"
              >
                <span className="requested-item-meta">
                  <span className="requested-item-title">{partDefinition.name}</span>
                  {partDefinition.isArchived ? (
                    <small className="requested-item-subtitle">Archived</small>
                  ) : null}
                  <small className="requested-item-subtitle" title={partSubtitle}>
                    {partSubtitle}
                  </small>
                </span>
              </span>
              <TableCell label="Number" valueClassName="font-mono">{partDefinition.partNumber}</TableCell>
              <TableCell label="Rev" valueClassName="font-mono">{partDefinition.revision}</TableCell>
              <TableCell label="Iteration">
                {formatIterationVersion(partDefinition.iteration)}
              </TableCell>
              <TableCell label="Type">{partDefinition.type}</TableCell>
              <TableCell label="Material">{materialName}</TableCell>
              <EditableHoverIndicator />
            </div>
          );
        })}
        {filteredPartDefinitions.length === 0 ? (
          <p className="empty-state">No part definitions match the current search.</p>
        ) : null}
        <PaginationControls {...pageChangeHandlers} label="part definitions" />
      </div>
    </div>
  );
}
