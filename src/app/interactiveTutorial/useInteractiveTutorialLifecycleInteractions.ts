import { useEffect, useState, type MutableRefObject } from "react";

import { getInteractiveTutorialStepError } from "./helpers/interactiveTutorialStepError";
import { hasInteractiveTutorialAlternativeOption, isInteractiveTutorialCreateStepModalInteraction, isInteractiveTutorialStepComplete } from "./helpers/interactiveTutorialStepCompletion";
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
  cardRef: MutableRefObject<HTMLElement | null>;
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
  cardRef,
  targetRef,
  stepBaselineLabelRef,
}: UseInteractiveTutorialLifecycleInteractionsOptions) {
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

    const context = {
      ...stepCompletionContext,
      stepBaselineLabel: stepBaselineLabelRef.current,
    };

    const handleClickCapture = (milestone: MouseEvent) => {
      const targetNode = milestone.target as Node | null;
      if (!targetNode || cardRef.current?.contains(targetNode)) {
        return;
      }

      const highlightedTarget = targetRef.current;
      const isTargetClick = highlightedTarget?.contains(targetNode);

      if (!isTargetClick) {
        if (isInteractiveTutorialCreateStepModalInteraction(currentStep, targetNode)) {
          return;
        }

        milestone.preventDefault();
        milestone.stopPropagation();
        return;
      }

      if (isInteractiveTutorialDropdownStep(currentStep)) {
        const selectionComplete = isInteractiveTutorialStepComplete(currentStep, context);
        if (
          highlightedTarget instanceof HTMLSelectElement &&
          selectionComplete &&
          !hasInteractiveTutorialAlternativeOption(
            currentStep,
            highlightedTarget,
            currentStep.id === "season" ? context.tutorialSeasonId : context.tutorialProjectId,
          )
        ) {
          setStepError(null);
          onAdvance();
          return;
        }

        if (!selectionComplete) {
          setStepError(
            getInteractiveTutorialStepError(currentStep, {
              tutorialSeasonId: context.tutorialSeasonId,
              tutorialProjectId: context.tutorialProjectId,
              tutorialSeasonName,
              tutorialProjectName,
            }),
          );
          return;
        }

        setStepError(null);
        return;
      }

      if (isInteractiveTutorialCreationStep(currentStep)) {
        setStepError(null);
        return;
      }

      window.setTimeout(() => {
        if (isInteractiveTutorialStepComplete(currentStep, context)) {
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

      window.setTimeout(() => {
        if (isInteractiveTutorialStepComplete(currentStep, context)) {
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

      window.setTimeout(() => {
        if (isInteractiveTutorialStepComplete(currentStep, context)) {
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
      document.removeEventListener("click", handleClickCapture, true);
      document.removeEventListener("change", handleChangeCapture, true);
    document.removeEventListener("input", handleInputCapture, true);
    window.removeEventListener("keydown", handleKeyDown);
  };
  }, [
    cardRef,
    currentStep,
    onAdvance,
    onClose,
    stepBaselineLabelRef,
    stepCompletionContext,
    targetRef,
    tutorialProjectName,
    tutorialSeasonName,
  ]);

  return { stepError };
}
