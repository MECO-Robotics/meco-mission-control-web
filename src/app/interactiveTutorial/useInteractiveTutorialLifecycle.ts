import { useEffect, useRef, useState } from "react";

import {
  getInteractiveTutorialStepError,
  hasInteractiveTutorialAlternativeOption,
  isInteractiveTutorialCreationStep,
  isInteractiveTutorialCreateStepModalInteraction,
  isInteractiveTutorialDropdownStep,
  isInteractiveTutorialSearchStep,
  isInteractiveTutorialStepComplete,
} from "./interactiveTutorialHelpers";
import type {
  InteractiveTutorialStep,
  InteractiveTutorialStepCompletionContext,
} from "./interactiveTutorialTypes";

type SpotlightRect =
  | {
      top: number;
      left: number;
      width: number;
      height: number;
    }
  | null;

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
  const [stepError, setStepError] = useState<string | null>(null);
  const [isTargetReady, setIsTargetReady] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect>(null);

  const cardRef = useRef<HTMLElement | null>(null);
  const targetRef = useRef<HTMLElement | null>(null);
  const stepBaselineLabelRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentStep) {
      stepBaselineLabelRef.current = null;
      return;
    }

    if (currentStep.id === "timeline-shift-period") {
      stepBaselineLabelRef.current =
        document.querySelector<HTMLElement>(".timeline-period-label")?.textContent?.trim() ?? "";
      return;
    }

    stepBaselineLabelRef.current = null;
  }, [currentStep]);

  useEffect(() => {
    if (targetRef.current) {
      targetRef.current = null;
    }

    setIsTargetReady(false);
    setSpotlightRect(null);
    setStepError(null);

    if (!currentStep) {
      return;
    }

    let frameId: number | null = null;
    let attempts = 0;
    const maxAttempts = 24;
    let resizeObserver: ResizeObserver | null = null;

    const updateSpotlightRect = () => {
      const activeTarget = targetRef.current;
      if (!activeTarget || !activeTarget.isConnected) {
        return;
      }

      const rect = activeTarget.getBoundingClientRect();
      setSpotlightRect({
        top: Math.max(6, rect.top - 6),
        left: Math.max(6, rect.left - 6),
        width: Math.max(20, rect.width + 12),
        height: Math.max(20, rect.height + 12),
      });
    };

    const setHighlightTarget = () => {
      const target = document.querySelector<HTMLElement>(currentStep.selector);

      if (!target) {
        if (attempts < maxAttempts) {
          attempts += 1;
          frameId = window.requestAnimationFrame(setHighlightTarget);
        }
        return;
      }

      target.scrollIntoView({
        behavior: attempts > 0 ? "smooth" : "auto",
        block: "center",
        inline: "nearest",
      });
      targetRef.current = target;
      updateSpotlightRect();
      window.addEventListener("resize", updateSpotlightRect);
      window.addEventListener("scroll", updateSpotlightRect, true);
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => updateSpotlightRect());
        resizeObserver.observe(target);
      }
      setIsTargetReady(true);
    };

    setHighlightTarget();

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateSpotlightRect);
      window.removeEventListener("scroll", updateSpotlightRect, true);
      targetRef.current = null;
      setIsTargetReady(false);
      setSpotlightRect(null);
    };
  }, [currentStep]);

  useEffect(() => {
    if (!currentStep) {
      return;
    }

    const context = {
      ...stepCompletionContext,
      stepBaselineLabel: stepBaselineLabelRef.current,
    };

    const handleClickCapture = (event: MouseEvent) => {
      const targetNode = event.target as Node | null;
      if (!targetNode || cardRef.current?.contains(targetNode)) {
        return;
      }

      const highlightedTarget = targetRef.current;
      const isTargetClick = highlightedTarget?.contains(targetNode);

      if (!isTargetClick) {
        if (isInteractiveTutorialCreateStepModalInteraction(currentStep, targetNode)) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
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
    currentStep,
    onAdvance,
    onClose,
    stepCompletionContext,
    tutorialProjectName,
    tutorialSeasonName,
  ]);

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
        setStepError(null);
        onAdvance();
      }, 120);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }
  }, [currentStep, onAdvance, stepCompletionContext]);

  return {
    isTargetReady,
    spotlightRect,
    stepError,
  };
}
