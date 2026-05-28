import { startTransition, useCallback } from "react";

import { resetInteractiveTutorialSession } from "@/lib/auth/bootstrap";
import { toErrorMessage } from "@/lib/appUtils/common";

import type { InteractiveTutorialCoreState } from "./core/useInteractiveTutorialCoreState";
import type { UseInteractiveTutorialOptions } from "./core/useInteractiveTutorialCoreTypes";
import { useInteractiveTutorialCoreActionsStart } from "./useInteractiveTutorialCoreActionsStart";

export function useInteractiveTutorialCoreActionsSession(
  options: UseInteractiveTutorialOptions,
  state: InteractiveTutorialCoreState,
) {
  const {
    setActiveTab,
    setTaskView,
    setRiskManagementView,
    setWorklogsView,
    setReportsView,
    setManufacturingView,
    setInventoryView,
    setSelectedSeasonId,
    setSelectedProjectId,
    setBootstrap,
    setDataMessage,
    handleUnauthorized,
  } = options;

  const {
    activeChapter,
    bootstrapSnapshot,
    nextChapterId,
    resetLocalTutorialState,
    returnState,
    setReturnState,
    setCompletedChapterId,
    setCompletedChapters,
    setStepIndex,
    stepIndex,
    steps,
  } = state;

  const { startInteractiveTutorial } = useInteractiveTutorialCoreActionsStart({
    options,
    state,
    onActivateTutorial: setReturnState,
  });

  const closeInteractiveTutorial = useCallback(async () => {
    const previousState = returnState;
    const previousBootstrap = bootstrapSnapshot;

    resetLocalTutorialState();

    if (previousBootstrap) {
      startTransition(() => {
        setBootstrap(previousBootstrap);
      });
    }

    if (previousState) {
      setActiveTab(previousState.activeTab);
      setTaskView(previousState.taskView);
      setRiskManagementView(previousState.riskManagementView);
      setWorklogsView(previousState.worklogsView);
      setReportsView(previousState.reportsView);
      setManufacturingView(previousState.manufacturingView);
      setInventoryView(previousState.inventoryView);
      setSelectedSeasonId(previousState.selectedSeasonId);
      setSelectedProjectId(previousState.selectedProjectId);
    }

    setReturnState(null);

    try {
      await resetInteractiveTutorialSession(handleUnauthorized);
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    }
  }, [
    bootstrapSnapshot,
    handleUnauthorized,
    resetLocalTutorialState,
    returnState,
    setActiveTab,
    setBootstrap,
    setDataMessage,
    setInventoryView,
    setManufacturingView,
    setReportsView,
    setRiskManagementView,
    setSelectedProjectId,
    setSelectedSeasonId,
    setReturnState,
    setTaskView,
    setWorklogsView,
  ]);

  const advanceInteractiveTutorial = useCallback(() => {
    if (stepIndex === null) {
      return;
    }

    if (stepIndex >= steps.length - 1) {
      if (activeChapter) {
        setCompletedChapterId(activeChapter.id);
        setCompletedChapters((current) =>
          current.includes(activeChapter.id) ? current : [...current, activeChapter.id],
        );
      }
      setStepIndex(null);
      return;
    }

    setStepIndex(stepIndex + 1);
  }, [activeChapter, setCompletedChapterId, setCompletedChapters, setStepIndex, stepIndex, steps.length]);

  const continueInteractiveTutorialToNextChapter = useCallback(() => {
    if (!nextChapterId) {
      void closeInteractiveTutorial();
      return;
    }

    void startInteractiveTutorial(nextChapterId);
  }, [closeInteractiveTutorial, nextChapterId, startInteractiveTutorial]);

  return {
    advanceInteractiveTutorial,
    closeInteractiveTutorial,
    continueInteractiveTutorialToNextChapter,
    startInteractiveTutorial,
  };
}
