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
      vendor: "Local Metals",
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
      risks: [],
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
      risks: [],
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
      source: "in-house",
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
      source: "in-house",
      materialId: null,
      description: "",
    },
  ],
  partInstances: [
    {
      id: "drive-installed",
      subsystemId: "drive",
      mechanismId: null,
      partDefinitionId: "drive-part",
      name: "Left drive rail",
      quantity: 1,
      trackIndividually: true,
      status: "ready",
    },
    {
      id: "arm-needed",
      subsystemId: "arm",
      mechanismId: null,
      partDefinitionId: "arm-part",
      name: "Shoulder bracket",
      quantity: 1,
      trackIndividually: true,
      status: "blocked",
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

it("finds a definition by its instance name after catalog consolidation", () => {
  expect(filterPartDefinitions({ bootstrap, partSearch: "Shoulder", partStatus: [], partSubsystem: [] }).map(part => part.id)).toEqual(["arm-part"]);
  expect(filterPartDefinitions({ bootstrap, partSearch: "Shoulder", partStatus: ["ready"], partSubsystem: [] })).toEqual([]);
});

it("finds a definition by its allocated mechanism while honoring subsystem filters", () => {
  const mapped = { ...bootstrap,
    mechanisms: [{ id: "wrist", subsystemId: "arm", name: "Wrist pivot", description: "", iteration: 1 }],
    partInstances: bootstrap.partInstances.map(instance => instance.id === "arm-needed" ? { ...instance, mechanismId: "wrist" } : instance),
  } satisfies BootstrapPayload;
  expect(filterPartDefinitions({ bootstrap: mapped, partSearch: "Wrist", partStatus: [], partSubsystem: ["arm"] }).map(part => part.id)).toEqual(["arm-part"]);
  expect(filterPartDefinitions({ bootstrap: mapped, partSearch: "Wrist", partStatus: [], partSubsystem: ["drive"] })).toEqual([]);
});
