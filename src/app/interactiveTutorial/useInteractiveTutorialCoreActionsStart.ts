import { startTransition, useCallback } from "react";

import { fetchBootstrap, resetInteractiveTutorialSession, startInteractiveTutorialSession } from "@/lib/auth/bootstrap";
import { toErrorMessage } from "@/lib/appUtils/common";
import type { BootstrapPayload } from "@/types/bootstrap";

import { getInteractiveTutorialCreationCounts } from "./helpers/interactiveTutorialCreationCounts";
import {
  buildInteractiveTutorialReturnState,
  getInteractiveTutorialChapter,
  resolveInteractiveTutorialSandboxSelection,
} from "./interactiveTutorialSessionHelpers";
import type { InteractiveTutorialCoreState } from "./useInteractiveTutorialCoreState";
import type { UseInteractiveTutorialOptions } from "./useInteractiveTutorialCoreTypes";

interface UseInteractiveTutorialCoreActionsStartOptions {
  options: UseInteractiveTutorialOptions;
  state: InteractiveTutorialCoreState;
  onActivateTutorial: (returnState: NonNullable<InteractiveTutorialCoreState["returnState"]>) => void;
}

export function useInteractiveTutorialCoreActionsStart({
  options,
  state,
  onActivateTutorial,
}: UseInteractiveTutorialCoreActionsStartOptions) {
  const { activeTab, taskView, riskManagementView, worklogsView, reportsView, manufacturingView, inventoryView, selectedSeasonId, selectedProjectId, bootstrap, isSidebarCollapsed, toggleSidebar, closeSidebarOverlay, handleUnauthorized, setActiveTab, setTaskView, setRiskManagementView, setWorklogsView, setReportsView, setManufacturingView, setInventoryView, setSelectedSeasonId, setSelectedProjectId, setActivePersonFilter, setBootstrap, setDataMessage } = options;
  const { bootstrapSnapshot, chapters, returnState, setBaselineCounts, setBootstrapSnapshot, setChapterId, setCompletedChapterId, setStepIndex, setTutorialProjectId, setTutorialProjectName, setTutorialSeasonId, setTutorialSeasonName, stepIndex } = state;

  const startInteractiveTutorial = useCallback(
    async (requestedChapterId: string = "planning") => {
      if (stepIndex !== null) {
        return;
      }

      const chapter = getInteractiveTutorialChapter(chapters, requestedChapterId);
      if (!chapter || chapter.steps.length === 0) {
        setDataMessage("Interactive tutorial chapter is unavailable right now.");
        return;
      }

      if (!returnState) {
        onActivateTutorial(
          buildInteractiveTutorialReturnState({
            activeTab,
            taskView,
            riskManagementView,
            worklogsView,
            reportsView,
            manufacturingView,
            inventoryView,
            selectedSeasonId,
            selectedProjectId,
          }),
        );
      }
      if (!bootstrapSnapshot) {
        setBootstrapSnapshot(structuredClone(bootstrap));
      }

      setDataMessage(null);
      try {
        if (!returnState) {
          await startInteractiveTutorialSession(handleUnauthorized);
        }
        await resetInteractiveTutorialSession(handleUnauthorized, "baseline");
      } catch (error) {
        setDataMessage(toErrorMessage(error));
        return;
      }

      let tutorialBootstrap: BootstrapPayload;
      try {
        tutorialBootstrap = await fetchBootstrap(undefined, undefined, undefined, handleUnauthorized);
      } catch (error) {
        setDataMessage(toErrorMessage(error));
        return;
      }

      startTransition(() => {
        setBootstrap(tutorialBootstrap);
      });
      setActivePersonFilter([]);

      const sandboxSelection = resolveInteractiveTutorialSandboxSelection(
        tutorialBootstrap,
        chapter.preferredProjectType,
      );

      if (sandboxSelection.tutorialSeasonId) {
        setSelectedSeasonId(
          chapter.id === "planning"
            ? sandboxSelection.nonTutorialSeasonId ?? sandboxSelection.tutorialSeasonId
            : sandboxSelection.tutorialSeasonId,
        );
        setTutorialSeasonId(sandboxSelection.tutorialSeasonId);
        setTutorialSeasonName(
          `${sandboxSelection.tutorialSeason?.name ?? "Tutorial Season"} (fake sandbox)`,
        );
      } else {
        setSelectedSeasonId(null);
        setTutorialSeasonId(null);
        setTutorialSeasonName("Tutorial Season (fake sandbox)");
      }

      if (sandboxSelection.tutorialProject) {
        if (chapter.id === "planning") {
          setSelectedProjectId(null);
        } else if (chapter.id === "outreach") {
          setSelectedProjectId(sandboxSelection.projectToForceOutreachSwitch?.id ?? null);
        } else {
          setSelectedProjectId(sandboxSelection.tutorialProject.id);
        }
        setTutorialProjectId(sandboxSelection.tutorialProject.id);
        setTutorialProjectName(sandboxSelection.tutorialProject.name);
      } else {
        setSelectedProjectId(null);
        setTutorialProjectId(null);
        setTutorialProjectName(null);
      }

      setBaselineCounts(
        getInteractiveTutorialCreationCounts(
          tutorialBootstrap,
          sandboxSelection.tutorialProjectId,
          sandboxSelection.tutorialSeasonId,
        ),
      );
      setCompletedChapterId(null);
      setChapterId(chapter.id);
      setActiveTab("tasks");
      setTaskView("timeline");
      setRiskManagementView("kanban");
      setWorklogsView("logs");
      setReportsView("qa");
      setManufacturingView("cnc");
      setInventoryView("materials");
      setStepIndex(0);

      if (isSidebarCollapsed) {
        toggleSidebar();
      }
      closeSidebarOverlay();
    },
    [
      activeTab,
      bootstrap,
      bootstrapSnapshot,
      chapters,
      closeSidebarOverlay,
      handleUnauthorized,
      inventoryView,
      isSidebarCollapsed,
      manufacturingView,
      onActivateTutorial,
      riskManagementView,
      reportsView,
      returnState,
      selectedProjectId,
      selectedSeasonId,
      setActivePersonFilter,
      setActiveTab,
      setBaselineCounts,
      setBootstrap,
      setBootstrapSnapshot,
      setChapterId,
      setCompletedChapterId,
      setDataMessage,
      setInventoryView,
      setManufacturingView,
      setReportsView, setRiskManagementView, setSelectedProjectId, setSelectedSeasonId, setStepIndex, setTaskView, setTutorialProjectId, setTutorialProjectName, setTutorialSeasonId, setTutorialSeasonName, setWorklogsView, taskView, toggleSidebar, worklogsView,
    ],
  );

  return {
    startInteractiveTutorial,
  };
}
