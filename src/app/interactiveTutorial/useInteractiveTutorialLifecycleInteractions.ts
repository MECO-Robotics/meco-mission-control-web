import { useEffect, useRef, useState, type MutableRefObject } from "react";

import { getInteractiveTutorialStepError } from "./helpers/interactiveTutorialStepError";
import { isInteractiveTutorialStepComplete } from "./helpers/interactiveTutorialStepCompletion";
import { isInteractiveTutorialCreationStep, isInteractiveTutorialDropdownStep, isInteractiveTutorialSearchStep } from "./helpers/interactiveTutorialStepGroups";
import type { InteractiveTutorialStep, InteractiveTutorialStepCompletionContext } from "./interactiveTutorialTypes";
import { useInteractiveTutorialLifecycleCreationAdvance } from "./useInteractiveTutorialLifecycleCreationAdvance";

interface UseInteractiveTutorialLifecycleInteractionsOptions {
  currentStep: InteractiveTutorialStep | null;
  stepCompletionContext: Omit<InteractiveTutorialStepCompletionContext, "stepBaselineLabel">;
  tutorialSeasonName: string | null;
  tutorialProjectName: string | null;
  onAdvance: () => void;
  onClose: () => void;
  targetRef: MutableRefObject<HTMLElement | null>;
  stepBaselineLabelRef: MutableRefObject<string | null>;
}

export function useInteractiveTutorialLifecycleInteractions({
  currentStep,
  stepCompletionContext,
  tutorialSeasonName,
  tutorialProjectName,
  onAdvance,
  onClose,
  targetRef,
  stepBaselineLabelRef,
}: UseInteractiveTutorialLifecycleInteractionsOptions) {
  const latestContext = useRef(stepCompletionContext);
  latestContext.current = stepCompletionContext;
  const [stepError, setStepError] = useState<string | null>(null);

  useInteractiveTutorialLifecycleCreationAdvance({
    currentStep,
    stepCompletionContext,
    stepBaselineLabelRef,
    onAdvance,
  });

  useEffect(() => {
    if (!currentStep) {
      return;
    }

    const timeouts = new Set<number>();
    const schedule = (callback: () => void, delay: number) => {
      const id = window.setTimeout(() => { timeouts.delete(id); callback(); }, delay);
      timeouts.add(id);
    };
    const completionContext = () => ({ ...latestContext.current, stepBaselineLabel: stepBaselineLabelRef.current });

    const handleClickCapture = (milestone: MouseEvent) => {
      const targetNode = milestone.target as Node | null;
      const element = targetNode instanceof Element ? targetNode : targetNode?.parentElement;
      if (!targetNode || element?.closest(".interactive-tutorial-card")) {
        return;
      }

      // The tutorial guides rather than traps input: popups, editor close buttons,
      // and keyboard-accessible controls remain usable between steps.
      if (isInteractiveTutorialDropdownStep(currentStep)) {
        if (element?.closest('[data-tutorial-target="season-select"], button[data-tutorial-target="project-select"]')) {
          schedule(() => {
            if (isInteractiveTutorialStepComplete(currentStep, completionContext())) {
              setStepError(null);
              onAdvance();
            } else setStepError(getInteractiveTutorialStepError(currentStep, { ...completionContext(), tutorialSeasonName, tutorialProjectName }));
          }, 100);
        }
        return;
      }

      if (isInteractiveTutorialCreationStep(currentStep)) {
        setStepError(null);
        return;
      }

      schedule(() => {
        const context = completionContext();
        if (isInteractiveTutorialStepComplete(currentStep, completionContext())) {
          setStepError(null);
          onAdvance();
          return;
        }

        setStepError(
          getInteractiveTutorialStepError(currentStep, {
            tutorialSeasonId: context.tutorialSeasonId,
            tutorialProjectId: context.tutorialProjectId,
            tutorialSeasonName,
            tutorialProjectName,
          }),
        );
      }, 100);
    };

    const handleChangeCapture = (event: Event) => {
      if (!isInteractiveTutorialDropdownStep(currentStep) && currentStep.id !== "timeline-week-view") {
        return;
      }

      const targetNode = event.target as Node | null;
      if (!targetNode || !targetRef.current?.contains(targetNode)) {
        return;
      }

      schedule(() => {
        const context = completionContext();
        if (isInteractiveTutorialStepComplete(currentStep, completionContext())) {
          setStepError(null);
          onAdvance();
          return;
        }

        setStepError(
          getInteractiveTutorialStepError(currentStep, {
            tutorialSeasonId: context.tutorialSeasonId,
            tutorialProjectId: context.tutorialProjectId,
            tutorialSeasonName,
            tutorialProjectName,
          }),
        );
      }, 0);
    };

    const handleInputCapture = (event: Event) => {
      if (!isInteractiveTutorialSearchStep(currentStep)) {
        return;
      }

      const targetNode = event.target as Node | null;
      if (!targetNode || !targetRef.current?.contains(targetNode)) {
        return;
      }

      schedule(() => {
        const context = completionContext();
        if (isInteractiveTutorialStepComplete(currentStep, completionContext())) {
          setStepError(null);
          onAdvance();
          return;
        }

        setStepError(
          getInteractiveTutorialStepError(currentStep, {
            tutorialSeasonId: context.tutorialSeasonId,
            tutorialProjectId: context.tutorialProjectId,
            tutorialSeasonName,
            tutorialProjectName,
          }),
        );
      }, 0);
    };

    const handleKeyDown = (milestone: KeyboardEvent) => {
      if (milestone.key === "Escape") {
        milestone.preventDefault();
        onClose();
      }
    };

    document.addEventListener("click", handleClickCapture, true);
    document.addEventListener("change", handleChangeCapture, true);
    document.addEventListener("input", handleInputCapture, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      timeouts.forEach((id) => window.clearTimeout(id));
      document.removeEventListener("click", handleClickCapture, true);
      document.removeEventListener("change", handleChangeCapture, true);
    document.removeEventListener("input", handleInputCapture, true);
    window.removeEventListener("keydown", handleKeyDown);
  };
  }, [
    currentStep,
    onAdvance,
    onClose,
    stepBaselineLabelRef,
    targetRef,
    tutorialProjectName,
    tutorialSeasonName,
  ]);

  return { stepError };
}
