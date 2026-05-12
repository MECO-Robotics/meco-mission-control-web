/// <reference types="jest" />

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CadIntegrationView, resolveSelectedDocumentRefId } from "../CadIntegrationView";
import {
  createOnshapeDocumentRef,
  createOnshapeOAuthAuthorizationUrl,
  fetchOnshapeImportEstimate,
  runOnshapeImport,
} from "../api/onshapeCadApi";
import { CadStatusPanels } from "../components/CadStatusPanels";
import type { OnshapeOverview } from "../model/cadIntegrationTypes";
import { parseOnshapeUrl } from "../model/onshapeUrlParser";

jest.mock("../api/onshapeCadApi", () => ({
  fetchOnshapeOverview: jest.fn(),
  fetchOnshapeImportEstimate: jest.fn(),
  createOnshapeDocumentRef: jest.fn(),
  createOnshapeOAuthAuthorizationUrl: jest.fn(),
  runOnshapeImport: jest.fn(),
}));

describe("CAD / Onshape integration view", () => {
  it("keeps document selection constrained to the refreshed overview refs", () => {
    const documentRefs = [
      { id: "ref-a", label: "Assembly A" },
      { id: "ref-b", label: "Assembly B" },
    ] as OnshapeOverview["documentRefs"];

    expect(resolveSelectedDocumentRefId("ref-b", documentRefs)).toBe("ref-b");
    expect(resolveSelectedDocumentRefId("stale-ref", documentRefs)).toBe("ref-a");
    expect(resolveSelectedDocumentRefId("stale-ref", [])).toBe("");
  });

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

  it("does not trigger Onshape sync actions during page render", () => {
    const markup = renderToStaticMarkup(React.createElement(CadIntegrationView, {}));

    expect(markup).toContain("CAD / Onshape integration");
    expect(createOnshapeDocumentRef).not.toHaveBeenCalled();
    expect(createOnshapeOAuthAuthorizationUrl).not.toHaveBeenCalled();
    expect(fetchOnshapeImportEstimate).not.toHaveBeenCalled();
    expect(runOnshapeImport).not.toHaveBeenCalled();
  });

  it("renders OAuth2 connection state without exposing token values", () => {
    const markup = renderToStaticMarkup(
      React.createElement(CadStatusPanels, {
        overview: {
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
        },
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

  it("renders backend sync estimates when available", () => {
    const markup = renderToStaticMarkup(
      React.createElement(CadStatusPanels, {
        overview: null,
        selectedReferenceType: "version",
        selectedSyncLevel: "bom",
        syncEstimate: {
          documentRefId: "onshape-ref-1",
          syncLevel: "bom",
          callsEstimated: 2,
          allowCached: true,
          requireFresh: false,
          immutableReference: true,
          referenceType: "version",
          cacheStatus: "hit",
          perSyncSoftBudget: 25,
          budgetAllowsSync: true,
          warnings: [],
        },
      }),
    );

    expect(markup).toContain("2 calls");
    expect(markup).toContain("cache hit");
    expect(markup).toContain("within budget");
  });
});
