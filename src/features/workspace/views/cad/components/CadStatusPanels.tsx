import type { OnshapeOverview, OnshapeSyncEstimate, SyncLevel } from "../model/cadIntegrationTypes";

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
  isConnectingOAuth = false,
  isRefreshingEstimate = false,
  onConnectOAuth,
  onRefreshEstimate,
  selectedSyncLevel,
  selectedReferenceType,
  syncEstimate,
}: {
  overview: OnshapeOverview | null;
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
  const oauthStatus = getOAuthStatusCopy(oauth);
  const credentialSource = getCredentialSourceCopy(oauth?.credentialSource);

  return (
    <div className="cad-grid cad-grid-three">
      <article className="cad-card cad-status-card">
        <span className="cad-eyebrow">Connection</span>
        <h3>Onshape status</h3>
        <p>{oauthStatus}</p>
        <dl className="cad-key-values">
          <div><dt>Auth mode</dt><dd>{connection?.authMode === "oauth" ? "OAuth2" : "not configured"}</dd></div>
          <div><dt>Base URL</dt><dd>{connection?.baseUrl ?? "https://cad.onshape.com"}</dd></div>
          <div><dt>OAuth app</dt><dd>{oauth?.clientConfigured ? "configured" : "not configured"}</dd></div>
          <div><dt>OAuth token</dt><dd>{credentialSource}</dd></div>
          <div><dt>Scopes</dt><dd>{oauth?.scopes.length ? oauth.scopes.join(", ") : "not configured"}</dd></div>
          <div><dt>Token expiry</dt><dd>{oauth?.tokenExpiresAt ? new Date(oauth.tokenExpiresAt).toLocaleString() : "unknown"}</dd></div>
          <div><dt>Credential ref</dt><dd>{connection?.credentialReference ?? "server env"}</dd></div>
        </dl>
        {oauth?.authorizationUrlAvailable && onConnectOAuth ? (
          <button className="secondary-button cad-oauth-button" disabled={isConnectingOAuth} onClick={onConnectOAuth} type="button">
            {isConnectingOAuth ? "Opening Onshape..." : "Connect Onshape OAuth2"}
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

function getOAuthStatusCopy(oauth: OnshapeOverview["connection"]["oauth"] | undefined) {
  if (!oauth?.clientConfigured) {
    return "OAuth2 app not configured on the backend.";
  }
  if (oauth.connected) {
    return "OAuth2 connected.";
  }
  return "OAuth2 app configured. Connect Onshape before running syncs.";
}

function getCredentialSourceCopy(source?: "runtime" | "env" | "none") {
  if (source === "runtime") {
    return "runtime token";
  }
  if (source === "env") {
    return "env token";
  }
  return "not connected";
}
