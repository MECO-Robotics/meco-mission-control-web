import { useState } from "react";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model";
import {
  buildEmptyQaReportPayload,
  buildEmptyTestResultPayload,
} from "@/lib/appUtils";
import type { QaReportPayload, TestResultPayload } from "@/types";
import type { EventReportModalMode, QaReportModalMode } from "@/features/workspace";

export function useAppWorkspaceUiStateReports() {
  const [qaReportModalMode, setQaReportModalMode] = useState<QaReportModalMode>(null);
  const [qaReportDraft, setQaReportDraft] = useState<QaReportPayload>(
    buildEmptyQaReportPayload(EMPTY_BOOTSTRAP),
  );
  const [isSavingQaReport, setIsSavingQaReport] = useState(false);

  const [eventReportModalMode, setEventReportModalMode] =
    useState<EventReportModalMode>(null);
  const [eventReportDraft, setEventReportDraft] = useState<TestResultPayload>(
    buildEmptyTestResultPayload(EMPTY_BOOTSTRAP),
  );
  const [eventReportFindings, setEventReportFindings] = useState("");
  const [isSavingEventReport, setIsSavingEventReport] = useState(false);

  return {
    eventReportDraft,
    eventReportFindings,
    eventReportModalMode,
    isSavingEventReport,
    isSavingQaReport,
    qaReportDraft,
    qaReportModalMode,
    setEventReportDraft,
    setEventReportFindings,
    setEventReportModalMode,
    setIsSavingEventReport,
    setIsSavingQaReport,
    setQaReportDraft,
    setQaReportModalMode,
  };
}
