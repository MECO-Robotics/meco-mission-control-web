import type { BootstrapPayload } from "@/types/bootstrap";
import { FindingRetestAction } from "./FindingRetestAction";

export function TestFindingRetestList({ bootstrap, testResults, canReview, handleUnauthorized, localActorMemberId, operationScope, viewScope = "", loadWorkspace, setDataMessage, readFinding }: {
  bootstrap: BootstrapPayload;
  testResults: BootstrapPayload["testResults"];
  canReview: boolean;
  handleUnauthorized?: () => void;
  localActorMemberId?: string | null;
  operationScope: string;
  viewScope?: string;
  loadWorkspace?: () => Promise<unknown>;
  setDataMessage?: (message: string | null) => void;
  readFinding: (findingId: string, sourceType: "qa" | "test") => Promise<import("@/types/recordsReporting").QaFindingRecord | null>;
}) {
  const visibleResultIds = new Set(testResults.map((result) => result.id));
  const findings = bootstrap.testFindings.filter((finding) => visibleResultIds.has(finding.testResultId));
  if (!findings.length) return null;
  return <section className="qa-report-details" aria-label="Test findings">
    <h3>Test findings</h3>
    {findings.map((finding) => {
      const result = testResults.find((candidate) => candidate.id === finding.testResultId);
      return <div className="qa-finding-details" key={finding.id}>
        <p><strong>{finding.title}</strong>: {finding.detail} <span className="table-cell-pill">{finding.status}</span></p>
        {result ? <p>{result.title}</p> : null}
        <FindingRetestAction key={`${viewScope}:test:${finding.id}`} finding={finding} sourceType="test" scope={operationScope} viewScope={viewScope} canReview={canReview} handleUnauthorized={handleUnauthorized} localActorMemberId={localActorMemberId} members={bootstrap.members} loadWorkspace={loadWorkspace} setDataMessage={setDataMessage} readFinding={readFinding} />
      </div>;
    })}
  </section>;
}
