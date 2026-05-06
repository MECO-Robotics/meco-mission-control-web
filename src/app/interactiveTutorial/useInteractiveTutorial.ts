import { useMemo } from "react";

import { useInteractiveTutorialLifecycle } from "./useInteractiveTutorialLifecycle";
import { isInteractiveTutorialCreationStep } from "./interactiveTutorialHelpers";
import { useInteractiveTutorialCoreActions } from "./useInteractiveTutorialCoreActions";
import { useInteractiveTutorialCoreState } from "./useInteractiveTutorialCoreState";
import type { UseInteractiveTutorialOptions } from "./useInteractiveTutorialCoreTypes";
import type {
  InteractiveTutorialOverlayProps,
} from "./interactiveTutorialTypes";

export function useInteractiveTutorial(options: UseInteractiveTutorialOptions) {
  const state = useInteractiveTutorialCoreState();
  const actions = useInteractiveTutorialCoreActions(options, state);
  const {
    advanceInteractiveTutorial,
    closeInteractiveTutorial,
    continueInteractiveTutorialToNextChapter,
    startInteractiveTutorial,
  } = actions;

  const stepCompletionContext = useMemo(
    () => ({
      bootstrap: options.bootstrap,
      tutorialProjectId: state.tutorialProjectId,
      tutorialSeasonId: state.tutorialSeasonId,
      baselineCounts: state.baselineCounts,
      activeTimelineTaskDetailId: options.activeTimelineTaskDetailId,
      taskModalMode: options.taskModalMode,
      activeTaskId: options.activeTaskId,
      materialModalMode: options.materialModalMode,
      activeMaterialId: options.activeMaterialId,
      subsystemModalMode: options.subsystemModalMode,
      activeSubsystemId: options.activeSubsystemId,
      mechanismModalMode: options.mechanismModalMode,
      activeMechanismId: options.activeMechanismId,
      manufacturingModalMode: options.manufacturingModalMode,
      activeManufacturingId: options.activeManufacturingId,
      workstreamModalMode: options.workstreamModalMode,
      activeWorkstreamId: options.activeWorkstreamId,
    }),
    [
      options.activeManufacturingId,
      options.activeMaterialId,
      options.activeSubsystemId,
      options.activeTaskId,
      options.activeTimelineTaskDetailId,
      options.activeWorkstreamId,
      options.activeMechanismId,
      options.bootstrap,
      options.manufacturingModalMode,
      options.materialModalMode,
      options.mechanismModalMode,
      options.subsystemModalMode,
      options.taskModalMode,
      options.workstreamModalMode,
      state.baselineCounts,
      state.tutorialProjectId,
      state.tutorialSeasonId,
    ],
  );

  const { isTargetReady, spotlightRect, stepError } = useInteractiveTutorialLifecycle({
    currentStep: state.currentStep,
    stepCompletionContext,
    tutorialSeasonName: state.tutorialSeasonName,
    tutorialProjectName: state.tutorialProjectName,
    onAdvance: advanceInteractiveTutorial,
    onClose: closeInteractiveTutorial,
  });

  const interactiveTutorialOverlayProps = useMemo<InteractiveTutorialOverlayProps | null>(() => {
    if (!state.currentStep && !state.completedChapterId) {
      return null;
    }

    return {
      chapterTitle: state.activeChapter?.title ?? "Tutorial",
      completedChapterTitle:
        state.chapters.find((chapter) => chapter.id === state.completedChapterId)?.title ??
        "Tutorial chapter",
      currentStep: state.currentStep,
      hasNextChapter: Boolean(state.nextChapterId),
      isCreationStep: isInteractiveTutorialCreationStep(state.currentStep),
      isTargetReady,
      onClose: () => {
        void closeInteractiveTutorial();
      },
      onContinue: () => {
        void continueInteractiveTutorialToNextChapter();
      },
      projectName: state.tutorialProjectName,
      seasonName: state.tutorialSeasonName,
      spotlightRect,
      stepCount: state.steps.length,
      stepError,
      stepNumber: state.stepNumber,
    };
  }, [
    closeInteractiveTutorial,
    continueInteractiveTutorialToNextChapter,
    isTargetReady,
    spotlightRect,
    state.activeChapter?.title,
    state.chapters,
    state.completedChapterId,
    state.currentStep,
    state.nextChapterId,
    state.stepNumber,
    state.steps.length,
    state.tutorialProjectName,
    state.tutorialSeasonName,
    stepError,
  ]);

  return {
    chapterStartOptions: state.chapterStartOptions,
    continueInteractiveTutorialToNextChapter,
    isInteractiveTutorialActive: state.isInteractiveTutorialActive,
    interactiveTutorialOverlayProps,
    startInteractiveTutorial,
  };
}
