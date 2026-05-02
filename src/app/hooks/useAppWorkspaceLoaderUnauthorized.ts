import { useCallback } from "react";

import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";

export function useAppWorkspaceLoaderUnauthorized(state: AppWorkspaceState) {
  return useCallback(() => {
    state.expireSession("Your session expired. Please sign in again.");
    state.setDataMessage("Your session expired. Please sign in again.");
  }, [state]);
}
