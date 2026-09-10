import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
import type { AppWorkspaceDerived } from "@/app/hooks/useAppWorkspaceDerived";
import { useAppWorkspaceLoaderActions } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderActions";
import { useAppWorkspaceLoaderUnauthorized } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderUnauthorized";
import { useAppWorkspaceLoaderUploads } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderUploads";
import { useAppWorkspaceLoaderWorkspace } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspace";

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
    notifyTaskEditSaved,
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
    notifyTaskEditSaved,
    requestMemberPhotoUpload,
    requestPhotoUpload,
    selectMember,
    toggleMyView,
  };
}
