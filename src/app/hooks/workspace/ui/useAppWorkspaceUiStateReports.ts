import { useState } from "react";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { buildEmptyQaReportPayload, buildEmptyTestResultPayload } from "@/lib/appUtils/payloadBuilders";
import type { QaReportPayload, TestResultPayload } from "@/types/payloads";
import type { MilestoneReportModalMode, QaReportModalMode } from "@/features/workspace/shared/model/workspaceModalModes";

export function useAppWorkspaceUiStateReports() {
  const [qaReportModalMode, setQaReportModalMode] = useState<QaReportModalMode>(null);
  const [qaReportDraft, setQaReportDraft] = useState<QaReportPayload>(
    buildEmptyQaReportPayload(EMPTY_BOOTSTRAP),
  );

  const [milestoneReportModalMode, setMilestoneReportModalMode] =
    useState<MilestoneReportModalMode>(null);
  const [milestoneReportDraft, setMilestoneReportDraft] = useState<TestResultPayload>(
    buildEmptyTestResultPayload(EMPTY_BOOTSTRAP),
  );
  const [milestoneReportFindings, setMilestoneReportFindings] = useState("");

  return {
    milestoneReportDraft,
    milestoneReportFindings,
    milestoneReportModalMode,
    qaReportDraft,
    qaReportModalMode,
    setMilestoneReportDraft,
    setMilestoneReportFindings,
    setMilestoneReportModalMode,
    setQaReportDraft,
    setQaReportModalMode,
  };
}
