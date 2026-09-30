/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { PartsToolbar } from "@/features/workspace/views/parts/PartsToolbar";
import { PartsDefinitionSection } from "@/features/workspace/views/parts/PartsDefinitionSection";
import { filterPartDefinitions } from "@/features/workspace/views/PartsView";
import type { BootstrapPayload } from "@/types/bootstrap";

const bootstrap: BootstrapPayload = {
  ...EMPTY_BOOTSTRAP,
  materials: [
    {
      id: "material-aluminum",
      name: "Aluminum tube",
      category: "metal",
      unit: "ft",
      onHandQuantity: 12,
      reorderPoint: 4,
      location: "Rack",
      preferredVendorId: null,
      notes: "",
    },
  ],
  subsystems: [
    {
      id: "drive",
      projectId: "project-1",
      name: "Drive",
      description: "",
      iteration: 1,
      isCore: true,
      parentSubsystemId: null,
      responsibleEngineerId: null,
      mentorIds: [],
    },
    {
      id: "arm",
      projectId: "project-1",
      name: "Arm",
      description: "",
      iteration: 1,
      isCore: true,
      parentSubsystemId: null,
      responsibleEngineerId: null,
      mentorIds: [],
    },
  ],
  partDefinitions: [
    {
      id: "drive-part",
      seasonId: "season-2026",
      name: "Drive rail",
      partNumber: "DRV-001",
      revision: "A",
      iteration: 1,
      type: "machined",
      defaultAcquisitionMethod: "manufacture",
      materialId: "material-aluminum",
      description: "",
    },
    {
      id: "arm-part",
      seasonId: "season-2026",
      name: "Arm bracket",
      partNumber: "ARM-001",
      revision: "A",
      iteration: 1,
      type: "printed",
      defaultAcquisitionMethod: "manufacture",
      materialId: null,
      description: "",
    },
  ],
  partInstances: [
    {
      id: "drive-installed",
      partDefinitionId: "drive-part",
      intendedSubsystemId: "drive",
      intendedMechanismId: null,
      location: { kind: "installed", subsystemId: "drive", mechanismId: null },
      readinessStatus: "ready",
    },
    {
      id: "arm-needed",
      partDefinitionId: "arm-part",
      intendedSubsystemId: "arm",
      intendedMechanismId: null,
      location: { kind: "stock", location: "Parts cabinet" },
      readinessStatus: "blocked",
    },
  ],
};

describe("PartsView filters", () => {
  it("uses the shared resource-list cell and native button row", () => {
    const columnFilters = { name: [], number: [], revision: [], iteration: [], type: [], material: [] };
    const columnOptions = { name: [], number: [], revision: [], iteration: [], type: [], material: [] };
    const markup = renderToStaticMarkup(
      React.createElement(PartsDefinitionSection, {
        bootstrap,
        filteredPartDefinitions: bootstrap.partDefinitions,
        hasActiveFilters: false,
        hasHiddenArchivedPartDefinitions: false,
        onCreatePartDefinition: jest.fn(),
        onEditPartDefinition: jest.fn(),
        partDefinitionFilterMotionClass: "",
        pageChangeHandlers: {
          onPageChange: jest.fn(),
          onPageSizeChange: jest.fn(),
          page: 1,
          pageSize: 15,
          pageSizeOptions: [15, 30, 60],
          rangeEnd: bootstrap.partDefinitions.length,
          rangeStart: 1,
          totalItems: bootstrap.partDefinitions.length,
          totalPages: 1,
        },
        columnFilters,
        columnOptions,
        setColumnFilter: jest.fn(),
        sortField: null,
        sortDirection: "ascending",
        onSort: jest.fn(),
      }),
    );

    expect(markup).toContain('<button class="ops-table ops-row materials-table editable-hover-target editable-hover-target-row"');
    expect(markup).toContain('resource-list-primary-cell" data-label="Part"');
    expect(markup).toContain("Drive rail");
    expect(markup).not.toContain('role="button"');
  });

  it("places the archive control in the topbar filter menu", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PartsToolbar, {
        bootstrap,
        mapping: "all",
        partSearch: "",
        partStatus: [],
        partSubsystem: [],
        setPartSearch: jest.fn(),
        setMapping: jest.fn(),
        setPartStatus: jest.fn(),
        setPartSubsystem: jest.fn(),
        setShowArchivedPartDefinitions: jest.fn(),
        showArchivedPartDefinitions: false,
      }),
    );

    expect(markup).toContain('aria-label="Part filters"');
    expect(markup).not.toContain('aria-label="Show archived definitions"');
    expect(markup).not.toContain("archive-filter-toggle");
  });

  it("filters part definitions by linked instance subsystem and status", () => {
    const filteredDefinitions = filterPartDefinitions({
      bootstrap,
      partSearch: "",
      partStatus: ["ready"],
      partSubsystem: ["drive"],
    });

    expect(filteredDefinitions.map((partDefinition) => partDefinition.id)).toEqual(["drive-part"]);
  });

  it("does not keep definitions visible when their linked instances miss active filters", () => {
    const filteredDefinitions = filterPartDefinitions({
      bootstrap,
      partSearch: "",
      partStatus: ["ready"],
      partSubsystem: ["arm"],
    });

    expect(filteredDefinitions).toEqual([]);
  });
});

it("finds a definition by physical instance ID and readiness", () => {
  expect(filterPartDefinitions({ bootstrap, partSearch: "arm-needed", partStatus: [], partSubsystem: [] }).map(part => part.id)).toEqual(["arm-part"]);
  expect(filterPartDefinitions({ bootstrap, partSearch: "arm-needed", partStatus: ["ready"], partSubsystem: [] })).toEqual([]);
});

it("finds a definition by its allocated mechanism while honoring subsystem filters", () => {
  const mapped = { ...bootstrap,
    mechanisms: [{ id: "wrist", subsystemId: "arm", name: "Wrist pivot", description: "", iteration: 1 }],
    partInstances: bootstrap.partInstances.map(instance => instance.id === "arm-needed" ? { ...instance, intendedMechanismId: "wrist" } : instance),
  } satisfies BootstrapPayload;
  expect(filterPartDefinitions({ bootstrap: mapped, partSearch: "Wrist", partStatus: [], partSubsystem: ["arm"] }).map(part => part.id)).toEqual(["arm-part"]);
  expect(filterPartDefinitions({ bootstrap: mapped, partSearch: "Wrist", partStatus: [], partSubsystem: ["drive"] })).toEqual([]);
});
