import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
import { useAppWorkspaceLoaderActions } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderActions";
import { useAppWorkspaceLoaderUnauthorized } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderUnauthorized";
import { useAppWorkspaceLoaderUploads } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderUploads";
import { useAppWorkspaceLoaderWorkspace } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspace";

export type AppWorkspaceLoader = ReturnType<typeof useAppWorkspaceLoader>;

export function useAppWorkspaceLoader(state: AppWorkspaceState) {
  const handleUnauthorized = useAppWorkspaceLoaderUnauthorized(state);
  const { requestMemberPhotoUpload, requestPhotoUpload } = useAppWorkspaceLoaderUploads(
    state,
    handleUnauthorized,
  );
  const {
    clearDataMessage,
    clearTaskEditNotice,
    notifyTaskEditCanceled,
    notifyTaskEditSaved,
    selectMember,
  } = useAppWorkspaceLoaderActions(state);
  const loadWorkspace = useAppWorkspaceLoaderWorkspace(state, handleUnauthorized, selectMember);

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
  };
}
