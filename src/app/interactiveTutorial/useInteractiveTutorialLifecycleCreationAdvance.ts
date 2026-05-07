import { useEffect, type MutableRefObject } from "react";

import { isInteractiveTutorialCreationStep } from "./helpers/interactiveTutorialStepGroups";
import { isInteractiveTutorialStepComplete } from "./helpers/interactiveTutorialStepCompletion";
import type {
  InteractiveTutorialStep,
  InteractiveTutorialStepCompletionContext,
} from "./interactiveTutorialTypes";

interface UseInteractiveTutorialLifecycleCreationAdvanceOptions {
  currentStep: InteractiveTutorialStep | null;
  stepCompletionContext: Omit<InteractiveTutorialStepCompletionContext, "stepBaselineLabel">;
  stepBaselineLabelRef: MutableRefObject<string | null>;
  onAdvance: () => void;
}

export function useInteractiveTutorialLifecycleCreationAdvance({
  currentStep,
  stepCompletionContext,
  stepBaselineLabelRef,
  onAdvance,
}: UseInteractiveTutorialLifecycleCreationAdvanceOptions) {
  useEffect(() => {
    if (!currentStep || !isInteractiveTutorialCreationStep(currentStep)) {
      return;
    }

    const context = {
      ...stepCompletionContext,
      stepBaselineLabel: stepBaselineLabelRef.current,
    };

    if (isInteractiveTutorialStepComplete(currentStep, context)) {
      const timeoutId = window.setTimeout(() => {
        onAdvance();
      }, 120);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }
  }, [currentStep, onAdvance, stepBaselineLabelRef, stepCompletionContext]);
}
