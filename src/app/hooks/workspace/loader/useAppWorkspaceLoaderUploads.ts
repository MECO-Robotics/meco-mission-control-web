import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
import { useCallback } from "react";

import type { UnauthorizedHandler } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";
import { requestImageUpload, requestVideoUpload } from "@/lib/auth/core/media";

export function useAppWorkspaceLoaderUploads(
  state: Pick<AppWorkspaceState, "bootstrap" | "selectedProjectId" | "selectedSeasonId">,
  handleUnauthorized: UnauthorizedHandler,
) {
  const requestPhotoUpload = useCallback(
    (projectId: string, file: File) =>
      file.type.startsWith("video/")
        ? requestVideoUpload(projectId, file, handleUnauthorized)
        : requestImageUpload(projectId, file, handleUnauthorized),
    [handleUnauthorized],
  );

  const requestMemberPhotoUpload = useCallback(
    (file: File) => {
      const projectId =
        state.selectedProjectId ??
        state.bootstrap.projects.find((project) => project.seasonId === state.selectedSeasonId)?.id ??
        state.bootstrap.projects[0]?.id ??
        null;

      if (!projectId) {
        return Promise.reject(new Error("No project is available for photo upload."));
      }

      return requestPhotoUpload(projectId, file);
    },
    [state.bootstrap.projects, state.selectedProjectId, state.selectedSeasonId, requestPhotoUpload],
  );

  return {
    requestMemberPhotoUpload,
    requestPhotoUpload,
  };
}
