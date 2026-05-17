/// <reference types="jest" />

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { uploadCadStepFile } from "../api/cadStepApi";
import { CadIntegrationView } from "../CadIntegrationView";
import { isMissingCadHierarchyReviewRoute, isMissingCadOptionalRoute } from "../cadOptionalRoutes";
import { CadStatusPanels } from "../components/CadStatusPanels";
import type { OnshapeOverview } from "../model/cadIntegrationTypes";
import { parseOnshapeUrl } from "../model/onshapeUrlParser";

jest.mock("../api/cadStepApi", () => ({
  fetchCadSnapshots: jest.fn(),
  fetchCadSnapshotSummary: jest.fn(),
  fetchCadSnapshotTree: jest.fn(),
  fetchCadSnapshotMappings: jest.fn(),
  fetchCadHierarchyReview: jest.fn(),
  fetchCadPartMatchProposals: jest.fn(),
  fetchCadSnapshotDiff: jest.fn(),
  fetchCadStepImportRuns: jest.fn(),
  uploadCadStepFile: jest.fn(),
  applyCadHierarchyReview: jest.fn(),
  applyCadSnapshotMappings: jest.fn(),
  finalizeCadSnapshot: jest.fn(),
}));

jest.mock("../api/onshapeCadApi", () => ({
  createOnshapeDocumentRef: jest.fn(),
  createOnshapeOAuthAuthorizationUrl: jest.fn(),
  fetchOnshapeImportEstimate: jest.fn(),
  fetchOnshapeOverview: jest.fn(),
  runOnshapeImport: jest.fn(),
}));

describe("CAD STEP mapper basics", () => {
  it("parses common Onshape references for preview without network calls", () => {
    const workspace = parseOnshapeUrl(
      "https://cad.onshape.com/documents/0123456789abcdef01234567/w/abcdefabcdefabcdefabcdef/e/111111111111111111111111?renderMode=0",
    );
    expect(workspace.ok).toBe(true);
    expect(workspace.referenceType).toBe("workspace");
    expect(workspace.workspaceId).toBe("abcdefabcdefabcdefabcdef");
    expect(workspace.elementId).toBe("111111111111111111111111");

    const version = parseOnshapeUrl(
      "https://cad.onshape.com/documents/0123456789abcdef01234567/v/222222222222222222222222/e/111111111111111111111111",
    );
    expect(version.referenceType).toBe("version");
    expect(version.versionId).toBe("222222222222222222222222");

    const microversion = parseOnshapeUrl(
      "https://cad.onshape.com/documents/0123456789abcdef01234567/m/333333333333333333333333/e/111111111111111111111111",
    );
    expect(microversion.referenceType).toBe("microversion");
    expect(microversion.microversionId).toBe("333333333333333333333333");

    const missingElement = parseOnshapeUrl(
      "https://cad.onshape.com/documents/0123456789abcdef01234567/v/222222222222222222222222",
    );
    expect(missingElement.ok).toBe(true);
    expect(missingElement.errors.join(" ")).toMatch(/elementId/);

    expect(parseOnshapeUrl("https://example.com/documents/x/w/y/e/z").ok).toBe(false);
    expect(parseOnshapeUrl("not-a-url").ok).toBe(false);
  });

  it("renders the STEP import workflow before the secondary Onshape sync section", () => {
    const markup = renderToStaticMarkup(React.createElement(CadIntegrationView, {}));

    expect(markup).toContain("STEP import");
    expect(markup).toContain("Export from the master assembly");
    expect(markup).toContain("MECH - Drivetrain - Swerve Module");
    expect(markup).toContain("CAD / Onshape integration");
    expect(markup).toContain("Onshape status");
    expect(markup).toContain("API budget");
    expect(markup.indexOf("STEP import")).toBeLessThan(markup.indexOf("CAD / Onshape integration"));
    expect(uploadCadStepFile).not.toHaveBeenCalled();
  });

  it("renders OAuth2 connection state without exposing token values", () => {
    const overview: OnshapeOverview = {
      connection: {
        authMode: "oauth",
        baseUrl: "https://cad.onshape.com",
        configured: true,
        credentialReference: "onshape-oauth",
        lastError: null,
        oauth: {
          clientConfigured: true,
          connected: true,
          authorizationUrlAvailable: true,
          scopes: ["OAuth2Read"],
          tokenExpiresAt: "2026-05-10T12:00:00.000Z",
          credentialSource: "runtime",
        },
      },
      documentRefs: [],
      importRuns: [],
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
    };

    const markup = renderToStaticMarkup(
      React.createElement(CadStatusPanels, {
        overview,
        selectedReferenceType: "version",
        selectedSyncLevel: "bom",
        syncEstimate: null,
        onConnectOAuth: jest.fn(),
      }),
    );

    expect(markup).toContain("OAuth2 connected");
    expect(markup).toContain("runtime token");
    expect(markup).toContain("OAuth2Read");
    expect(markup).not.toContain("oauth-access-token");
  });

  it("treats only the missing hierarchy route response as optional", () => {
    const routeError = Object.assign(
      new Error("Route GET:/api/cad/snapshots/cad-snapshot-0003/hierarchy-review not found"),
      { statusCode: 404 },
    );
    const proposalsRouteError = Object.assign(
      new Error("Route GET:/api/cad/snapshots/cad-snapshot-0003/part-match-proposals not found"),
      { statusCode: 404 },
    );
    const diffRouteError = Object.assign(
      new Error("Route GET:/api/cad/snapshots/cad-snapshot-0003/diff not found"),
      { statusCode: 404 },
    );
    const snapshotError = Object.assign(new Error("CAD snapshot was not found."), { statusCode: 404 });
    const serverError = Object.assign(new Error("Server Error"), { statusCode: 500 });

    expect(isMissingCadHierarchyReviewRoute(routeError)).toBe(true);
    expect(isMissingCadOptionalRoute(proposalsRouteError, "/part-match-proposals")).toBe(true);
    expect(isMissingCadOptionalRoute(diffRouteError, "/diff")).toBe(true);
    expect(isMissingCadHierarchyReviewRoute(snapshotError)).toBe(false);
    expect(isMissingCadOptionalRoute(snapshotError, "/diff")).toBe(false);
    expect(isMissingCadHierarchyReviewRoute(serverError)).toBe(false);
    expect(isMissingCadOptionalRoute(serverError, "/part-match-proposals")).toBe(false);
  });
});
