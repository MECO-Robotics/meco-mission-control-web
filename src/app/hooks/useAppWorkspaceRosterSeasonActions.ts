import { useCallback, type FormEvent } from "react";

import { toErrorMessage } from "@/lib/appUtils";
import { createSeasonRecord } from "@/lib/auth";
import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";

export function useAppWorkspaceRosterSeasonActions(model: AppWorkspaceModel) {
  const handleCreateSeason = useCallback(() => {
    model.setDataMessage(null);
    model.setSeasonNameDraft("");
    model.setIsAddSeasonPopupOpen(true);
  }, [model]);

  const closeCreateSeasonPopup = useCallback(() => {
    if (model.isSavingSeason) {
      return;
    }

    model.setIsAddSeasonPopupOpen(false);
    model.setSeasonNameDraft("");
  }, [model]);

  const handleCreateSeasonSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const seasonName = model.seasonNameDraft.trim();
      if (seasonName.length < 2) {
        model.setDataMessage("Season names need at least 2 characters.");
        return;
      }

      model.setIsSavingSeason(true);
      model.setDataMessage(null);

      try {
        const season = await createSeasonRecord({ name: seasonName }, model.handleUnauthorized);
        await model.loadWorkspace();
        model.setSelectedSeasonId(season.id);
        model.setSelectedProjectId(null);
        model.setIsAddSeasonPopupOpen(false);
        model.setSeasonNameDraft("");
      } catch (error) {
        model.setDataMessage(toErrorMessage(error));
      } finally {
        model.setIsSavingSeason(false);
      }
    },
    [model],
  );

  return {
    closeCreateSeasonPopup,
    handleCreateSeason,
    handleCreateSeasonSubmit,
  };
}
