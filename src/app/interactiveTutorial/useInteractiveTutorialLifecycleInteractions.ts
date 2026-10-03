import { useEffect, useRef, useState, type MutableRefObject } from "react";

import { getInteractiveTutorialStepError } from "./helpers/interactiveTutorialStepError";
import { isInteractiveTutorialStepComplete } from "./helpers/interactiveTutorialStepCompletion";
import { isInteractiveTutorialCreationStep, isInteractiveTutorialDropdownStep, isInteractiveTutorialSearchStep } from "./helpers/interactiveTutorialStepGroups";
import type { InteractiveTutorialStep, InteractiveTutorialStepCompletionContext } from "./interactiveTutorialTypes";

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
  const latestInteraction = useRef({ stepCompletionContext, onAdvance, onClose });
  latestInteraction.current = { stepCompletionContext, onAdvance, onClose };
  const [stepError, setStepError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentStep || !isInteractiveTutorialCreationStep(currentStep)) {
      return;
    }

    const context = {
      ...stepCompletionContext,
      stepBaselineLabel: stepBaselineLabelRef.current,
    };
    if (!isInteractiveTutorialStepComplete(currentStep, context)) {
      return;
    }

    const timeoutId = window.setTimeout(onAdvance, 120);
    return () => window.clearTimeout(timeoutId);
  }, [currentStep, onAdvance, stepBaselineLabelRef, stepCompletionContext]);

  useEffect(() => {
    if (!currentStep) {
      return;
    }

    const timeouts = new Set<number>();
    const scheduleCompletion = (delay: number) => {
      const id = window.setTimeout(() => {
        timeouts.delete(id);
        const context = { ...latestInteraction.current.stepCompletionContext, stepBaselineLabel: stepBaselineLabelRef.current };
        if (isInteractiveTutorialStepComplete(currentStep, context)) {
          setStepError(null);
          latestInteraction.current.onAdvance();
        } else {
          setStepError(getInteractiveTutorialStepError(currentStep, {
            tutorialSeasonId: context.tutorialSeasonId,
            tutorialProjectId: context.tutorialProjectId,
            tutorialSeasonName,
            tutorialProjectName,
          }));
        }
      }, delay);
      timeouts.add(id);
    };

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
          scheduleCompletion(100);
        }
        return;
      }

      if (isInteractiveTutorialCreationStep(currentStep)) {
        setStepError(null);
        return;
      }

      scheduleCompletion(100);
    };

    const handleFieldCapture = (event: Event) => {
      const acceptsEvent = event.type === "input"
        ? isInteractiveTutorialSearchStep(currentStep)
        : isInteractiveTutorialDropdownStep(currentStep) || currentStep.id === "timeline-week-view";
      const targetNode = event.target as Node | null;
      if (acceptsEvent && targetNode && targetRef.current?.contains(targetNode)) {
        scheduleCompletion(0);
      }
    };

    const handleKeyDown = (milestone: KeyboardEvent) => {
      if (milestone.key === "Escape") {
        milestone.preventDefault();
        latestInteraction.current.onClose();
      }
    };

    document.addEventListener("click", handleClickCapture, true);
    document.addEventListener("change", handleFieldCapture, true);
    document.addEventListener("input", handleFieldCapture, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      timeouts.forEach((id) => window.clearTimeout(id));
      document.removeEventListener("click", handleClickCapture, true);
      document.removeEventListener("change", handleFieldCapture, true);
      document.removeEventListener("input", handleFieldCapture, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    currentStep,
    stepBaselineLabelRef,
    targetRef,
    tutorialProjectName,
    tutorialSeasonName,
  ]);

  return { stepError };
}
