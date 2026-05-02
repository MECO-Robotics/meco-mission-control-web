import { useState } from "react";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model";
import { buildEmptyWorkLogPayload } from "@/lib/appUtils";
import type { WorkLogPayload } from "@/types";
import type { WorkLogModalMode } from "@/features/workspace";

export function useAppWorkspaceUiStateWorkLog() {
  const [workLogModalMode, setWorkLogModalMode] = useState<WorkLogModalMode>(null);
  const [workLogDraft, setWorkLogDraft] = useState<WorkLogPayload>(
    buildEmptyWorkLogPayload(EMPTY_BOOTSTRAP),
  );
  const [isSavingWorkLog, setIsSavingWorkLog] = useState(false);

  return {
    isSavingWorkLog,
    setIsSavingWorkLog,
    setWorkLogDraft,
    setWorkLogModalMode,
    workLogDraft,
    workLogModalMode,
  };
}
