/// <reference types="jest" />

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";

import { CadIntegrationView, getScopedDocumentRefs, resolveSelectedDocumentRefId } from "../CadIntegrationView";
import {
  createOnshapeDocumentRef,
  createOnshapeOAuthAuthorizationUrl,
  fetchOnshapeOverview,
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

class MinimalDomNode {
  nodeType: number;
  nodeName: string;
  tagName: string;
  namespaceURI = "http://www.w3.org/1999/xhtml";
  ownerDocument: MinimalDomDocument;
  parentNode: MinimalDomNode | null = null;
  childNodes: MinimalDomNode[] = [];
  style: Record<string, string> = {};
  attributes: Record<string, string> = {};
  nodeValue = "";

  constructor(nodeType: number, nodeName: string, ownerDocument: MinimalDomDocument) {
    this.nodeType = nodeType;
    this.nodeName = nodeName;
    this.tagName = nodeName;
    this.ownerDocument = ownerDocument;
  }

  appendChild(child: MinimalDomNode) {
    this.childNodes.push(child);
    child.parentNode = this;
    return child;
  }

  insertBefore(child: MinimalDomNode, before: MinimalDomNode) {
    const index = this.childNodes.indexOf(before);
    if (index === -1) {
      return this.appendChild(child);
    }

    this.childNodes.splice(index, 0, child);
    child.parentNode = this;
    return child;
  }

  removeChild(child: MinimalDomNode) {
    this.childNodes = this.childNodes.filter((item) => item !== child);
    child.parentNode = null;
    return child;
  }

  setAttribute(name: string, value: string) {
    this.attributes[name] = value;
  }

  removeAttribute(name: string) {
    delete this.attributes[name];
  }

  addEventListener() {
    return undefined;
  }

  removeEventListener() {
    return undefined;
  }

  get options() {
    return this.childNodes.filter((child) => child.nodeName === "OPTION");
  }
}

class MinimalTextNode extends MinimalDomNode {
  constructor(text: string, ownerDocument: MinimalDomDocument) {
    super(3, "#text", ownerDocument);
    this.nodeValue = text;
  }
}

class MinimalDomDocument extends MinimalDomNode {
  defaultView: Record<string, unknown>;
  documentElement: MinimalDomNode;
  activeElement: MinimalDomNode | null = null;

  constructor(defaultView: Record<string, unknown>) {
    super(9, "#document", undefined as unknown as MinimalDomDocument);
    this.ownerDocument = this;
    this.defaultView = defaultView;
    this.documentElement = new MinimalDomNode(1, "HTML", this);
  }

  createElement(tagName: string) {
    return new MinimalDomNode(1, tagName.toUpperCase(), this);
  }

  createElementNS(namespaceURI: string, tagName: string) {
    const node = this.createElement(tagName);
    node.namespaceURI = namespaceURI;
    return node;
  }

  createTextNode(text: string) {
    return new MinimalTextNode(text, this);
  }
}

function installMinimalDom() {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalNode = globalThis.Node;
  const originalElement = globalThis.Element;
  const originalHTMLElement = globalThis.HTMLElement;
  const originalHTMLIFrameElement = globalThis.HTMLIFrameElement;
  const originalActEnvironment = (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT;
  const fakeWindow: Record<string, unknown> = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  const fakeDocument = new MinimalDomDocument(fakeWindow);
  fakeWindow.document = fakeDocument;
  fakeWindow.Node = MinimalDomNode;
  fakeWindow.Element = MinimalDomNode;
  fakeWindow.HTMLElement = MinimalDomNode;
  fakeWindow.HTMLIFrameElement = class MinimalIFrame {};

  Object.assign(globalThis, {
    document: fakeDocument,
    window: fakeWindow,
    Node: MinimalDomNode,
    Element: MinimalDomNode,
    HTMLElement: MinimalDomNode,
    HTMLIFrameElement: fakeWindow.HTMLIFrameElement,
    IS_REACT_ACT_ENVIRONMENT: true,
  });

  return () => {
    Object.assign(globalThis, {
      document: originalDocument,
      window: originalWindow,
      Node: originalNode,
      Element: originalElement,
      HTMLElement: originalHTMLElement,
      HTMLIFrameElement: originalHTMLIFrameElement,
      IS_REACT_ACT_ENVIRONMENT: originalActEnvironment,
    });
  };
}

function createOverview(overrides: Partial<OnshapeOverview> = {}): OnshapeOverview {
  return {
    connection: {
      authMode: "oauth",
      baseUrl: "https://cad.onshape.com",
      configured: false,
      credentialReference: null,
      lastError: null,
      oauth: {
        clientConfigured: false,
        connected: false,
        authorizationUrlAvailable: false,
        scopes: [],
        tokenExpiresAt: null,
        credentialSource: "none",
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
    ...overrides,
  };
}

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

  it("scopes saved CAD refs to the active project and season", () => {
    const documentRefs = [
      { id: "current", label: "Current", projectId: "project-a", seasonId: "season-2026" },
      { id: "other-project", label: "Other project", projectId: "project-b", seasonId: "season-2026" },
      { id: "other-season", label: "Other season", projectId: "project-a", seasonId: "season-2025" },
      { id: "global", label: "Unscoped", projectId: null, seasonId: null },
    ] as OnshapeOverview["documentRefs"];

    expect(getScopedDocumentRefs(documentRefs, "project-a", "season-2026").map((ref) => ref.id)).toEqual(["current"]);
    expect(getScopedDocumentRefs(documentRefs, "project-a").map((ref) => ref.id)).toEqual(["current", "other-season"]);
    expect(getScopedDocumentRefs(documentRefs).map((ref) => ref.id)).toEqual(["global"]);
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

  it("does not trigger Onshape sync actions during server render", () => {
    const markup = renderToStaticMarkup(React.createElement(CadIntegrationView, {}));

    expect(markup).toContain("CAD / Onshape integration");
    expect(createOnshapeDocumentRef).not.toHaveBeenCalled();
    expect(createOnshapeOAuthAuthorizationUrl).not.toHaveBeenCalled();
    expect(fetchOnshapeImportEstimate).not.toHaveBeenCalled();
    expect(runOnshapeImport).not.toHaveBeenCalled();
  });

  it("does not trigger Onshape sync actions when mounted", async () => {
    const restoreDom = installMinimalDom();
    (fetchOnshapeOverview as jest.Mock).mockResolvedValue(createOverview());
    const root = createRoot(document.createElement("div"));

    try {
      await act(async () => {
        root.render(React.createElement(CadIntegrationView, {}));
      });

      expect(fetchOnshapeOverview).toHaveBeenCalledTimes(1);
      expect(createOnshapeDocumentRef).not.toHaveBeenCalled();
      expect(createOnshapeOAuthAuthorizationUrl).not.toHaveBeenCalled();
      expect(fetchOnshapeImportEstimate).not.toHaveBeenCalled();
      expect(runOnshapeImport).not.toHaveBeenCalled();
    } finally {
      await act(async () => {
        root.unmount();
      });
      restoreDom();
    }
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
