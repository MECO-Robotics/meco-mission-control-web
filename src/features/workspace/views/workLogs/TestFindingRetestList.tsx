import type { BootstrapPayload } from "@/types/bootstrap";
import { FindingRetestAction } from "./FindingRetestAction";

export function TestFindingRetestList({ bootstrap, canReview, handleUnauthorized, operationScope, loadWorkspace, setDataMessage, readFinding }: {
  bootstrap: BootstrapPayload;
  canReview: boolean;
  handleUnauthorized?: () => void;
  operationScope: string;
  loadWorkspace?: () => Promise<unknown>;
  setDataMessage?: (message: string | null) => void;
  readFinding: (findingId: string, sourceType: "qa" | "test") => Promise<import("@/types/recordsReporting").QaFindingRecord | null>;
}) {
  if (!bootstrap.testFindings.length) return null;
  return <section className="qa-report-details" aria-label="Test findings">
    <h3>Test findings</h3>
    {bootstrap.testFindings.map((finding) => {
      const result = bootstrap.testResults.find((candidate) => candidate.id === finding.testResultId);
      return <div className="qa-finding-details" key={finding.id}>
        <p><strong>{finding.title}</strong>: {finding.detail} <span className="table-cell-pill">{finding.status}</span></p>
        {result ? <p>{result.title}</p> : null}
        <FindingRetestAction key={`${operationScope}:test:${finding.id}`} finding={finding} sourceType="test" scope={operationScope} canReview={canReview} handleUnauthorized={handleUnauthorized} members={bootstrap.members} loadWorkspace={loadWorkspace} setDataMessage={setDataMessage} readFinding={readFinding} />
      </div>;
    })}
  </section>;
}
