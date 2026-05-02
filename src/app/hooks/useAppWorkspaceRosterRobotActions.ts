import { useCallback, type FormEvent } from "react";

import { toErrorMessage } from "@/lib/appUtils";
import { createProjectRecord, updateProjectRecord } from "@/lib/auth";
import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import type { ProjectPayload } from "@/types";

export function useAppWorkspaceRosterRobotActions(model: AppWorkspaceModel) {
  const handleCreateRobot = useCallback(() => {
    if (!model.selectedSeasonId) {
      model.setDataMessage("Pick a season before adding a robot.");
      return;
    }

    model.setDataMessage(null);
    model.setRobotProjectNameDraft("");
    model.setRobotProjectModalMode("create");
  }, [model]);

  const handleEditSelectedRobot = useCallback(() => {
    if (model.selectedProject?.projectType !== "robot") {
      return;
    }

    model.setDataMessage(null);
    model.setRobotProjectNameDraft(model.selectedProject.name);
    model.setRobotProjectModalMode("edit");
  }, [model]);

  const closeRobotProjectPopup = useCallback(() => {
    if (model.isSavingRobotProject) {
      return;
    }

    model.setRobotProjectModalMode(null);
    model.setRobotProjectNameDraft("");
  }, [model]);

  const handleRobotProjectSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const robotName = model.robotProjectNameDraft.trim();
      if (robotName.length < 2) {
        model.setDataMessage("Robot names need at least 2 characters.");
        return;
      }

      if (model.robotProjectModalMode === "create" && !model.selectedSeasonId) {
        model.setDataMessage("Pick a season before adding a robot.");
        return;
      }

      if (model.robotProjectModalMode === "edit" && model.selectedProject?.projectType !== "robot") {
        model.setDataMessage("Select a robot before editing its name.");
        return;
      }

      model.setIsSavingRobotProject(true);
      model.setDataMessage(null);

      try {
        if (model.robotProjectModalMode === "create" && model.selectedSeasonId) {
          const project = await createProjectRecord(
            {
              seasonId: model.selectedSeasonId,
              name: robotName,
              projectType: "robot",
              status: "active",
            },
            model.handleUnauthorized,
          );
          await model.loadWorkspace();
          model.setSelectedProjectId(project.id);
        } else if (model.robotProjectModalMode === "edit" && model.selectedProject) {
          const payload: ProjectPayload = {
            name: robotName,
          };
          const project = await updateProjectRecord(
            model.selectedProject.id,
            payload,
            model.handleUnauthorized,
          );
          await model.loadWorkspace();
          model.setSelectedProjectId(project.id);
        }

        model.setRobotProjectModalMode(null);
        model.setRobotProjectNameDraft("");
      } catch (error) {
        model.setDataMessage(toErrorMessage(error));
      } finally {
        model.setIsSavingRobotProject(false);
      }
    },
    [model],
  );

  return {
    closeRobotProjectPopup,
    handleCreateRobot,
    handleEditSelectedRobot,
    handleRobotProjectSubmit,
  };
}
