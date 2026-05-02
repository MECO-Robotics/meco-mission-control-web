// @ts-nocheck
import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
import type { AppWorkspaceDerived } from "@/app/hooks/useAppWorkspaceDerived";
import { useAppWorkspaceLoaderActions } from "@/app/hooks/useAppWorkspaceLoaderActions";
import { useAppWorkspaceLoaderUnauthorized } from "@/app/hooks/useAppWorkspaceLoaderUnauthorized";
import { useAppWorkspaceLoaderUploads } from "@/app/hooks/useAppWorkspaceLoaderUploads";
import { useAppWorkspaceLoaderWorkspace } from "@/app/hooks/useAppWorkspaceLoaderWorkspace";

export type AppWorkspaceLoader = ReturnType<typeof useAppWorkspaceLoader>;

export function useAppWorkspaceLoader(
  state: AppWorkspaceState,
  model: AppWorkspaceState & AppWorkspaceDerived,
) {
  const handleUnauthorized = useAppWorkspaceLoaderUnauthorized(state);
  const { requestMemberPhotoUpload, requestPhotoUpload } = useAppWorkspaceLoaderUploads(
    model,
    handleUnauthorized,
  );
  const {
    clearDataMessage,
    clearTaskEditNotice,
    notifyTaskEditCanceled,
    selectMember,
    toggleMyView,
  } = useAppWorkspaceLoaderActions(state, model);
  const loadWorkspace = useAppWorkspaceLoaderWorkspace(state, model, handleUnauthorized, selectMember);

  return {
    clearDataMessage,
    clearTaskEditNotice,
    handleUnauthorized,
    loadWorkspace,
    notifyTaskEditCanceled,
    requestMemberPhotoUpload,
    requestPhotoUpload,
    selectMember,
    toggleMyView,
  };
}
