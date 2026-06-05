/// <reference types="jest" />

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { buildSyncHistoryRows, CadSyncHistoryPanel } from "../components/CadSyncHistoryPanel";
import type { OnshapeOverview } from "../model/cadIntegrationTypes";

function createOverview(overrides: Partial<OnshapeOverview> = {}): OnshapeOverview {
  return {
    connection: {
      authMode: "oauth",
      baseUrl: "https://cad.onshape.com",
      configured: true,
      credentialReference: "onshape-oauth",
      lastError: null,
    },
    documentRefs: [],
    importRuns: [],
    syncJobs: [],
    snapshots: [],
    latestSnapshot: null,
    assemblyNodes: [],
    partDefinitions: [],
    partInstances: [],
    warnings: [],
    budget: {
      planType: "education",
      dailySoftBudget: 100,
      perSyncSoftBudget: 25,
      callsUsedToday: 0,
      callsUsedThisMonth: 0,
      callsUsedThisYear: 0,
      warningThresholdPercent: 70,
      hardStopThresholdPercent: 90,
      lastRateLimitRemaining: null,
    },
    ...overrides,
  };
}

describe("CadSyncHistoryPanel", () => {
  it("lists populated sync jobs with status, actor, timestamp, warnings, and changed objects", () => {
    const overview = createOverview({
      importRuns: [{
        id: "cad-import-7",
        onshapeDocumentRefId: "ref-1",
        syncLevel: "bom",
        status: "completed",
        startedAt: "2026-06-01T12:00:00.000Z",
        completedAt: "2026-06-01T12:05:00.000Z",
        requestedBy: "cad.lead@mecorobotics.org",
        callsEstimated: 2,
        callsUsed: 2,
        stoppedReason: null,
        errorMessage: null,
      }],
      syncJobs: [{
        id: "sync-job-7",
        importRunId: "cad-import-7",
        onshapeDocumentRefId: "ref-1",
        status: "completed",
        startedAt: "2026-06-01T12:00:00.000Z",
        completedAt: "2026-06-01T12:05:00.000Z",
        actor: "cad.lead@mecorobotics.org",
        sourceReferenceJson: { referenceType: "version" },
        summaryJson: {
          assemblyNodeCount: 2,
          partDefinitionCount: 3,
          partInstanceCount: 5,
          warningCount: 1,
        },
        errorMessage: null,
        createdAt: "2026-06-01T12:00:00.000Z",
      }],
    });

    const rows = buildSyncHistoryRows(overview);
    expect(rows[0]).toMatchObject({
      actor: "cad.lead@mecorobotics.org",
      changedObjectCount: 10,
      status: "completed",
      warningCount: 1,
    });

    const markup = renderToStaticMarkup(React.createElement(CadSyncHistoryPanel, { overview }));
    expect(markup).toContain("Recent Onshape sync attempts");
    expect(markup).toContain("sync-job-7 / cad-import-7");
    expect(markup).toContain("cad.lead@mecorobotics.org");
    expect(markup).toContain("completed");
    expect(markup).toContain("10");
  });

  it("shows failed sync errors and falls back to import-run derived warning and object counts", () => {
    const overview = createOverview({
      importRuns: [{
        id: "cad-import-failed",
        onshapeDocumentRefId: "ref-1",
        syncLevel: "bom",
        status: "failed",
        startedAt: "2026-06-02T12:00:00.000Z",
        completedAt: "2026-06-02T12:01:00.000Z",
        requestedBy: null,
        callsEstimated: 2,
        callsUsed: 1,
        stoppedReason: "Onshape API returned 403",
        errorMessage: "OAuth token cannot read this document.",
      }],
      snapshots: [{
        id: "snapshot-previous",
        label: "Previous snapshot",
        onshapeDocumentRefId: "ref-1",
        importRunId: "other-run",
        source: "manual_snapshot",
        documentId: "doc-1",
        workspaceId: null,
        versionId: "version-1",
        microversionId: null,
        elementId: "element-1",
        immutable: true,
        createdAt: "2026-06-01T12:00:00.000Z",
        previousSnapshotId: null,
      }],
      warnings: [{
        id: "warning-1",
        importRunId: "cad-import-failed",
        snapshotId: null,
        severity: "error",
        code: "onshape_sync_failed",
        title: "Sync failed",
        message: "OAuth token cannot read this document.",
        createdAt: "2026-06-02T12:01:00.000Z",
      }],
    });

    const rows = buildSyncHistoryRows(overview);
    expect(rows[0]).toMatchObject({
      actor: "Actor not reported by platform",
      changedObjectCount: null,
      errorSummary: "OAuth token cannot read this document.",
      status: "failed",
      warningCount: 1,
    });

    const markup = renderToStaticMarkup(React.createElement(CadSyncHistoryPanel, { overview }));
    expect(markup).toContain("OAuth token cannot read this document.");
    expect(markup).toContain("Actor not reported by platform");
    expect(markup).toContain("not reported");
  });

  it("keeps legacy import runs that do not have matching sync jobs", () => {
    const overview = createOverview({
      importRuns: [
        {
          id: "cad-import-with-job",
          onshapeDocumentRefId: "ref-1",
          syncLevel: "full",
          status: "completed",
          startedAt: "2026-06-03T12:00:00.000Z",
          completedAt: "2026-06-03T12:03:00.000Z",
          requestedBy: "cad.lead@mecorobotics.org",
          callsEstimated: 2,
          callsUsed: 2,
          stoppedReason: null,
          errorMessage: null,
        },
        {
          id: "legacy-import-only",
          onshapeDocumentRefId: "ref-1",
          syncLevel: "bom",
          status: "completed",
          startedAt: "2026-06-02T12:00:00.000Z",
          completedAt: "2026-06-02T12:02:00.000Z",
          requestedBy: "legacy.cad@mecorobotics.org",
          callsEstimated: 1,
          callsUsed: 1,
          stoppedReason: null,
          errorMessage: null,
        },
      ],
      syncJobs: [
        {
          id: "sync-job-current",
          importRunId: "cad-import-with-job",
          onshapeDocumentRefId: "ref-1",
          status: "completed",
          startedAt: "2026-06-03T12:00:00.000Z",
          completedAt: "2026-06-03T12:03:00.000Z",
          actor: "cad.lead@mecorobotics.org",
          sourceReferenceJson: {},
          summaryJson: { warningCount: 0, changedObjectCount: 4 },
          errorMessage: null,
          createdAt: "2026-06-03T12:00:00.000Z",
        },
      ],
    });

    const rows = buildSyncHistoryRows(overview);

    expect(rows.map((row) => row.id)).toEqual(["sync-job-current", "legacy-import-only"]);
    expect(rows[1]).toMatchObject({
      actor: "legacy.cad@mecorobotics.org",
      label: "legacy-import-only",
      syncLevel: "bom",
    });
  });

  it("renders an empty state explaining how to create sync history", () => {
    const markup = renderToStaticMarkup(React.createElement(CadSyncHistoryPanel, { overview: createOverview() }));

    expect(markup).toContain("No Onshape sync attempts yet.");
    expect(markup).toContain("Save an Onshape document link");
    expect(markup).toContain("run the selected sync");
  });
});
