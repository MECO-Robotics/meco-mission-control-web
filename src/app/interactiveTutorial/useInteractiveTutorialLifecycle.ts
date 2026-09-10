import { useInteractiveTutorialLifecycleInteractions } from "./useInteractiveTutorialLifecycleInteractions";
import { useInteractiveTutorialLifecycleTargeting } from "./useInteractiveTutorialLifecycleTargeting";
import type {
  InteractiveTutorialStep,
  InteractiveTutorialStepCompletionContext,
} from "./interactiveTutorialTypes";

interface UseInteractiveTutorialLifecycleOptions {
  currentStep: InteractiveTutorialStep | null;
  stepCompletionContext: Omit<InteractiveTutorialStepCompletionContext, "stepBaselineLabel">;
  tutorialSeasonName: string | null;
  tutorialProjectName: string | null;
  onAdvance: () => void;
  onClose: () => void;
}

export function useInteractiveTutorialLifecycle({
  currentStep,
  stepCompletionContext,
  tutorialSeasonName,
  tutorialProjectName,
  onAdvance,
  onClose,
}: UseInteractiveTutorialLifecycleOptions) {
  const { isTargetReady, spotlightRect, stepBaselineLabelRef, targetRef } =
    useInteractiveTutorialLifecycleTargeting({ currentStep });
  const { stepError } = useInteractiveTutorialLifecycleInteractions({
    currentStep,
    stepCompletionContext,
    tutorialSeasonName,
    tutorialProjectName,
    onAdvance,
    onClose,
    targetRef,
    stepBaselineLabelRef,
  });

  return {
    isTargetReady,
    spotlightRect,
    stepError,
  };
}
