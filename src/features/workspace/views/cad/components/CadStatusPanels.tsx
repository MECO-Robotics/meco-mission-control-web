import type { OnshapeOverview, OnshapeSyncEstimate, SyncLevel } from "../model/cadIntegrationTypes";

export type OnshapeConnectionHealth = "connected" | "expired" | "disconnected" | "unavailable";

const syncCopy: Record<SyncLevel, string> = {
  link_only: "Link Only: stores the Onshape URL without spending API calls.",
  shallow: "Shallow Sync: verifies the link and caches document or assembly info.",
  bom: "BOM Sync: recommended default. Imports assembly and part structure using cached/bulk data where possible.",
  deep_release: "Deep Release Sync: higher API usage. Use before manufacturing release or design review.",
};

const estimatedCalls: Record<SyncLevel, string> = {
  link_only: "0",
  shallow: "about 1",
  bom: "about 2",
  deep_release: "3+",
};

export function CadStatusPanels({
  overview,
  overviewError,
  isConnectingOAuth = false,
  isRefreshingEstimate = false,
  onConnectOAuth,
  onRefreshEstimate,
  selectedSyncLevel,
  selectedReferenceType,
  syncEstimate,
}: {
  overview: OnshapeOverview | null;
  overviewError?: string | null;
  isConnectingOAuth?: boolean;
  isRefreshingEstimate?: boolean;
  onConnectOAuth?: () => void;
  onRefreshEstimate?: () => void;
  selectedSyncLevel: SyncLevel;
  selectedReferenceType: string;
  syncEstimate?: OnshapeSyncEstimate | null;
}) {
  const budget = overview?.budget;
  const connection = overview?.connection;
  const oauth = connection?.oauth;
  const health = getOnshapeConnectionHealth(overview, overviewError);
  const isWorkspace = selectedReferenceType === "workspace";
  const estimatedCallText = syncEstimate
    ? `${syncEstimate.callsEstimated} calls`
    : estimatedCalls[selectedSyncLevel];
  const cacheText = syncEstimate
    ? `cache ${syncEstimate.cacheStatus.replace(/_/g, " ")}`
    : "cache-first";
  const budgetText = syncEstimate
    ? (syncEstimate.budgetAllowsSync ? "within budget" : "over budget")
    : "not estimated";
  const healthCopy = getOnshapeHealthCopy(health);
  const credentialSource = getCredentialSourceCopy(oauth?.credentialSource);
  const connectActionLabel = getConnectActionLabel(health);

  return (
    <div className="cad-grid cad-grid-three">
      <article className="cad-card cad-status-card" data-onshape-health={health}>
        <span className="cad-eyebrow">Connection</span>
        <div className="cad-status-title-row">
          <h3>Onshape status</h3>
          <span className={`cad-health-badge cad-health-${health}`}>{healthCopy.label}</span>
        </div>
        <p>{healthCopy.description}</p>
        <dl className="cad-key-values">
          <div><dt>Auth mode</dt><dd>{connection?.authMode === "oauth" ? "OAuth2" : "not configured"}</dd></div>
          <div><dt>Base URL</dt><dd>{connection?.baseUrl ?? "https://cad.onshape.com"}</dd></div>
          <div><dt>OAuth app</dt><dd>{oauth?.clientConfigured ? "configured" : "not configured"}</dd></div>
          <div><dt>Credential source</dt><dd>{credentialSource}</dd></div>
          <div><dt>Scopes</dt><dd>{oauth?.scopes.length ? oauth.scopes.join(", ") : "not configured"}</dd></div>
          <div><dt>Token expiry</dt><dd>{oauth?.tokenExpiresAt ? new Date(oauth.tokenExpiresAt).toLocaleString() : "unknown"}</dd></div>
          <div><dt>Backend</dt><dd>{health === "unavailable" ? "unavailable" : "reachable"}</dd></div>
          {connection?.lastError ? <div><dt>Last error</dt><dd>{connection.lastError}</dd></div> : null}
        </dl>
        {connectActionLabel && oauth?.authorizationUrlAvailable && onConnectOAuth ? (
          <button className="secondary-button cad-oauth-button" disabled={isConnectingOAuth} onClick={onConnectOAuth} type="button">
            {isConnectingOAuth ? "Opening Onshape..." : connectActionLabel}
          </button>
        ) : null}
      </article>

      <article className="cad-card cad-status-card">
        <span className="cad-eyebrow">Sync estimate</span>
        <h3>{selectedSyncLevel.replace(/_/g, " ")}</h3>
        <p>{syncCopy[selectedSyncLevel]}</p>
        <dl className="cad-key-values">
          <div><dt>Estimated calls</dt><dd>{estimatedCallText}</dd></div>
          <div><dt>Cache policy</dt><dd>{cacheText}</dd></div>
          <div><dt>Budget</dt><dd>{budgetText}</dd></div>
          <div><dt>Reference</dt><dd>{selectedReferenceType || "none"}</dd></div>
        </dl>
        {isWorkspace ? (
          <p className="cad-warning-copy">
            This reference points to a workspace. For review/release, create an Onshape version and sync that version instead.
          </p>
        ) : null}
        {onRefreshEstimate ? (
          <button className="secondary-button cad-oauth-button" disabled={isRefreshingEstimate} onClick={onRefreshEstimate} type="button">
            {isRefreshingEstimate ? "Refreshing estimate..." : "Refresh estimate"}
          </button>
        ) : null}
      </article>

      <article className="cad-card cad-status-card">
        <span className="cad-eyebrow">API budget</span>
        <h3>Conservative mode</h3>
        <p>Normal pages read Mission Control cache only. API calls happen through explicit sync actions.</p>
        <dl className="cad-key-values">
          <div><dt>Today</dt><dd>{budget?.callsUsedToday ?? 0}</dd></div>
          <div><dt>Month</dt><dd>{budget?.callsUsedThisMonth ?? 0}</dd></div>
          <div><dt>Year</dt><dd>{budget?.callsUsedThisYear ?? 0}</dd></div>
          <div><dt>Last remaining</dt><dd>{budget?.lastRateLimitRemaining ?? "unknown"}</dd></div>
        </dl>
      </article>
    </div>
  );
}

export function getOnshapeConnectionHealth(
  overview: OnshapeOverview | null | undefined,
  overviewError?: string | null,
  now: Date = new Date(),
): OnshapeConnectionHealth {
  if (overviewError) {
    return "unavailable";
  }

  const connection = overview?.connection;
  const oauth = connection?.oauth;
  if (!connection?.configured || !oauth?.clientConfigured) {
    return "disconnected";
  }

  const expiresAt = oauth.tokenExpiresAt ? Date.parse(oauth.tokenExpiresAt) : Number.NaN;
  if (Number.isFinite(expiresAt) && expiresAt <= now.getTime()) {
    return "expired";
  }

  if (oauth.connected) {
    return "connected";
  }

  return "disconnected";
}

function getOnshapeHealthCopy(health: OnshapeConnectionHealth) {
  if (health === "connected") {
    return {
      label: "Connected",
      description: "Onshape is connected. Explicit sync actions can use the server-held OAuth grant.",
    };
  }
  if (health === "expired") {
    return {
      label: "Expired",
      description: "Onshape authorization has expired. Reconnect before running syncs.",
    };
  }
  if (health === "unavailable") {
    return {
      label: "Unavailable",
      description: "Connection health is unavailable because the Onshape overview service could not be reached.",
    };
  }

  return {
    label: "Disconnected",
    description: "Onshape is disconnected. Connect before running syncs.",
  };
}

function getCredentialSourceCopy(source?: "runtime" | "env" | "none") {
  if (source === "runtime") {
    return "runtime session";
  }
  if (source === "env") {
    return "server environment";
  }
  return "not connected";
}

function getConnectActionLabel(health: OnshapeConnectionHealth) {
  if (health === "unavailable") {
    return null;
  }
  if (health === "connected" || health === "expired") {
    return "Reconnect Onshape OAuth2";
  }
  return "Connect Onshape OAuth2";
}
