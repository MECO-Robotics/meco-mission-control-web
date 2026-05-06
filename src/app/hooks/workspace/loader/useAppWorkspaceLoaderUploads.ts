import { useCallback } from "react";

import type { AppWorkspaceLoaderModel, UnauthorizedHandler } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";
import { requestImageUpload, requestVideoUpload } from "@/lib/auth/core/media";

export function useAppWorkspaceLoaderUploads(
  model: AppWorkspaceLoaderModel,
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
        model.selectedProjectId ??
        model.bootstrap.projects.find((project) => project.seasonId === model.selectedSeasonId)?.id ??
        model.bootstrap.projects[0]?.id ??
        null;

      if (!projectId) {
        return Promise.reject(new Error("No project is available for photo upload."));
      }

      return requestPhotoUpload(projectId, file);
    },
    [model.bootstrap.projects, model.selectedProjectId, model.selectedSeasonId, requestPhotoUpload],
  );

  return {
    requestMemberPhotoUpload,
    requestPhotoUpload,
  };
}
