import type { OnshapeDocumentRefRecord, OnshapeOverview } from "./cadIntegrationTypes";

export const defaultOnshapeOverview: OnshapeOverview = {
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
};

export function resolveSelectedDocumentRefId(current: string, documentRefs: OnshapeDocumentRefRecord[]) {
  return current && documentRefs.some((ref) => ref.id === current) ? current : documentRefs[0]?.id || "";
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
