import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
import type { AppWorkspaceDerived } from "@/app/hooks/useAppWorkspaceDerived";
import { updateFavoriteView } from "@/lib/auth/navigationFavorites";
import type { NavigationSubItemId } from "@/lib/workspaceNavigation";
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
  const toggleFavoriteView = async (
    viewId: NavigationSubItemId,
    isFavorite: boolean,
  ) => {
    state.setDataMessage(null);

    try {
      let favoriteViews = await updateFavoriteView(viewId, isFavorite, handleUnauthorized);

      if (viewId === "reports-worklogs" && !isFavorite) {
        await updateFavoriteView("reports-work-logs", isFavorite, handleUnauthorized);
        favoriteViews = favoriteViews.filter((favorite) => favorite.viewId !== "reports-work-logs");
      }

      state.setBootstrap((current) => ({
        ...current,
        favoriteViews,
      }));
    } catch (error) {
      state.setDataMessage(error instanceof Error ? error.message : String(error));
    }
  };

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
    toggleFavoriteView,
    toggleMyView,
  };
}
