import { useCallback, useEffect, useRef, useState } from "react";
import { getSessionGeneration } from "@/lib/auth/core/sessionStorage";
import { getLocalWorkspaceGeneration } from "@/lib/localWorkspace/session";
import type { WorkspaceLoader } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";

// An editor can close while its write still belongs to the current workspace.
// Keep those lifetimes separate: refresh a successful write, but never change
// the busy state, error, or visibility of a newer draft.
export function useCatalogEditorLifecycle({ loadWorkspace, selectedProjectId, selectedSeasonId }: {
  loadWorkspace: WorkspaceLoader;
  selectedProjectId: string | null;
  selectedSeasonId: string | null;
}) {
  const [pending, setPending] = useState<"save" | "delete" | null>(null);
  const busy = useRef(false);
  const editorVersion = useRef(0);
  const workspaceVersion = useRef(0);
  const latestLoadWorkspace = useRef(loadWorkspace);
  latestLoadWorkspace.current = loadWorkspace;

  useEffect(() => () => { workspaceVersion.current += 1; }, [selectedProjectId, selectedSeasonId]);

  const resetEditor = useCallback(() => {
    editorVersion.current += 1;
    busy.current = false;
    setPending(null);
  }, []);

  const captureWorkspace = useCallback(() => {
    const workspace = workspaceVersion.current;
    const session = getSessionGeneration();
    const local = getLocalWorkspaceGeneration();
    const isCurrent = () => workspace === workspaceVersion.current &&
      session === getSessionGeneration() && local === getLocalWorkspaceGeneration();
    return {
      isCurrent,
      async refresh() {
        if (isCurrent()) await latestLoadWorkspace.current(undefined, isCurrent);
      },
    };
  }, []);

  const beginOperation = useCallback((kind: "save" | "delete" = "save") => {
    if (busy.current) return null;
    busy.current = true;
    setPending(kind);
    const editor = editorVersion.current;
    const workspace = captureWorkspace();
    const isCurrent = () => workspace.isCurrent() && editor === editorVersion.current;
    return {
      isCurrent,
      refresh: workspace.refresh,
      finish() {
        if (isCurrent()) {
          busy.current = false;
          setPending(null);
        }
      },
    };
  }, [captureWorkspace]);

  return { captureWorkspace, beginOperation, resetEditor, isSaving: pending === "save", isDeleting: pending === "delete" };
}
