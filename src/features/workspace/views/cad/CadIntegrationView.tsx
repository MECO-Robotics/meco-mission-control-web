import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import {
  createOnshapeDocumentRef,
  createOnshapeOAuthAuthorizationUrl,
  fetchOnshapeImportEstimate,
  fetchOnshapeOverview,
  runOnshapeImport,
} from "./api/onshapeCadApi";
import { CadDataPanels } from "./components/CadDataPanels";
import { CadLinkSyncPanel } from "./components/CadLinkSyncPanel";
import { CadStatusPanels } from "./components/CadStatusPanels";
import type {
  OnshapeDocumentRefRecord,
  OnshapeOverview,
  OnshapeSyncEstimate,
  SyncLevel,
} from "./model/cadIntegrationTypes";
import { parseOnshapeUrl } from "./model/onshapeUrlParser";
import "./cadIntegration.css";
import "./cadIntegrationData.css";

const defaultOverview: OnshapeOverview = {
  connection: {
    authMode: "oauth",
    baseUrl: "https://cad.onshape.com",
    configured: false,
    credentialReference: null,
    oauth: {
      clientConfigured: false,
      connected: false,
      authorizationUrlAvailable: false,
      scopes: [],
      tokenExpiresAt: null,
      credentialSource: "none",
    },
    lastError: null,
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

export function resolveSelectedDocumentRefId(current: string, documentRefs: OnshapeOverview["documentRefs"]) {
  if (current && documentRefs.some((ref) => ref.id === current)) {
    return current;
  }

  return documentRefs[0]?.id || "";
}

export function getScopedDocumentRefs(
  documentRefs: OnshapeDocumentRefRecord[],
  projectId?: string | null,
  seasonId?: string | null,
) {
  return documentRefs.filter((ref) => {
    const matchesProject = projectId ? ref.projectId === projectId : !ref.projectId;
    const matchesSeason = seasonId ? ref.seasonId === seasonId : true;
    return matchesProject && matchesSeason;
  });
}

export function CadIntegrationView({
  projectId,
  seasonId,
}: {
  projectId?: string | null;
  seasonId?: string | null;
}) {
  const [overview, setOverview] = useState<OnshapeOverview>(defaultOverview);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("Robot master assembly");
  const [selectedDocumentRefId, setSelectedDocumentRefId] = useState("");
  const [syncLevel, setSyncLevel] = useState<SyncLevel>("bom");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnectingOAuth, setIsConnectingOAuth] = useState(false);
  const [isRefreshingEstimate, setIsRefreshingEstimate] = useState(false);
  const [syncEstimate, setSyncEstimate] = useState<OnshapeSyncEstimate | null>(null);
  const overviewRequestIdRef = useRef(0);
  const estimateRequestIdRef = useRef(0);

  const parsedUrl = useMemo(() => (url.trim() ? parseOnshapeUrl(url.trim()) : null), [url]);
  const scopedDocumentRefs = useMemo(
    () => getScopedDocumentRefs(overview.documentRefs, projectId, seasonId),
    [overview.documentRefs, projectId, seasonId],
  );
  const selectedDocumentRef = scopedDocumentRefs.find((ref) => ref.id === selectedDocumentRefId) ?? null;
  const selectedReferenceType = selectedDocumentRef?.referenceType ?? parsedUrl?.referenceType ?? "unknown";

  const loadOverview = useCallback(async () => {
    const requestId = overviewRequestIdRef.current + 1;
    overviewRequestIdRef.current = requestId;
    setIsLoading(true);
    try {
      const nextOverview = await fetchOnshapeOverview();
      if (overviewRequestIdRef.current !== requestId) {
        return;
      }

      const nextDocumentRefs = getScopedDocumentRefs(nextOverview.documentRefs, projectId, seasonId);
      setOverview(nextOverview);
      setSelectedDocumentRefId((current) => resolveSelectedDocumentRefId(current, nextDocumentRefs));
    } catch (error) {
      if (overviewRequestIdRef.current !== requestId) {
        return;
      }

      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      if (overviewRequestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [projectId, seasonId]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview, projectId, seasonId]);

  useEffect(() => {
    estimateRequestIdRef.current += 1;
    setIsRefreshingEstimate(false);
    setSyncEstimate(null);
  }, [selectedDocumentRefId, syncLevel]);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!parsedUrl?.ok) {
      setMessage("Paste a valid Onshape document URL first.");
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      const response = await createOnshapeDocumentRef({
        url: parsedUrl.originalUrl,
        label,
        projectId,
        seasonId,
      });
      await loadOverview();
      setSelectedDocumentRefId(response.item.id);
      setMessage(response.warnings.length ? response.warnings.join(" ") : "Onshape link saved without API calls.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async () => {
    if (!selectedDocumentRefId) {
      setMessage("Select a saved Onshape reference first.");
      return;
    }

    setIsSyncing(true);
    setMessage(null);
    try {
      const response = await runOnshapeImport({ documentRefId: selectedDocumentRefId, syncLevel });
      await loadOverview();
      setMessage(
        `Sync ${response.result.status}: ${response.result.partDefinitionCount} part definitions, ${response.result.partInstanceCount} instances, ${response.result.warningCount} warnings.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
      await loadOverview().catch(() => undefined);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectOAuth = async () => {
    const popup = window.open("about:blank", "_blank");
    if (!popup) {
      setMessage("Onshape OAuth2 popup was blocked. Allow popups for this site, then try connecting again.");
      return;
    }

    popup.opener = null;
    setIsConnectingOAuth(true);
    setMessage(null);
    try {
      const response = await createOnshapeOAuthAuthorizationUrl();
      popup.location.href = response.authorizationUrl;
      setMessage("Onshape OAuth2 authorization opened in a new tab. Return here after approving access.");
    } catch (error) {
      popup.close();
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsConnectingOAuth(false);
    }
  };

  const handleRefreshEstimate = async () => {
    if (!selectedDocumentRefId) {
      setMessage("Select a saved Onshape reference first.");
      return;
    }

    const requestId = estimateRequestIdRef.current + 1;
    estimateRequestIdRef.current = requestId;
    setIsRefreshingEstimate(true);
    setMessage(null);
    try {
      const response = await fetchOnshapeImportEstimate({ documentRefId: selectedDocumentRefId, syncLevel });
      if (estimateRequestIdRef.current !== requestId) {
        return;
      }

      setSyncEstimate(response.item);
    } catch (error) {
      if (estimateRequestIdRef.current !== requestId) {
        return;
      }

      setSyncEstimate(null);
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      if (estimateRequestIdRef.current === requestId) {
        setIsRefreshingEstimate(false);
      }
    }
  };

  return (
    <section className="panel dense-panel cad-integration-shell">
      <div className="panel-header compact-header cad-header">
        <div className="queue-section-header">
          <h2>CAD / Onshape integration</h2>
          <p className="section-copy">
            Snapshot-first CAD traceability for assemblies, subassemblies, part definitions, and part instances.
          </p>
        </div>
        <div className="cad-header-meta">
          <span>{isLoading ? "Refreshing local cache..." : "Local cache only on page load"}</span>
          <span>{overview.latestSnapshot ? `Last synced ${new Date(overview.latestSnapshot.createdAt).toLocaleString()}` : "No snapshot yet"}</span>
        </div>
      </div>

      {message ? <div className="cad-message" role="status">{message}</div> : null}

      <CadStatusPanels
        overview={overview}
        isConnectingOAuth={isConnectingOAuth}
        isRefreshingEstimate={isRefreshingEstimate}
        onRefreshEstimate={handleRefreshEstimate}
        onConnectOAuth={handleConnectOAuth}
        selectedReferenceType={selectedReferenceType}
        selectedSyncLevel={syncLevel}
        syncEstimate={syncEstimate}
      />

      <CadLinkSyncPanel
        documentRefs={scopedDocumentRefs}
        isSaving={isSaving}
        isSyncing={isSyncing}
        label={label}
        onLabelChange={setLabel}
        onSave={handleSave}
        onSelectDocumentRef={setSelectedDocumentRefId}
        onSync={handleSync}
        onSyncLevelChange={setSyncLevel}
        onUrlChange={setUrl}
        parsedUrl={parsedUrl}
        selectedDocumentRefId={selectedDocumentRefId}
        syncLevel={syncLevel}
        url={url}
      />

      <CadDataPanels overview={overview} />
    </section>
  );
}
