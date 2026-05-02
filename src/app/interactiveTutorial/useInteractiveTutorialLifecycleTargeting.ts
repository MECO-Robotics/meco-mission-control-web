import { useEffect, useRef, useState } from "react";

import type { InteractiveTutorialStep } from "./interactiveTutorialTypes";

type SpotlightRect =
  | {
      top: number;
      left: number;
      width: number;
      height: number;
    }
  | null;

interface UseInteractiveTutorialLifecycleTargetingOptions {
  currentStep: InteractiveTutorialStep | null;
}

export function useInteractiveTutorialLifecycleTargeting({
  currentStep,
}: UseInteractiveTutorialLifecycleTargetingOptions) {
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

  return {
    cardRef,
    isTargetReady,
    spotlightRect,
    stepBaselineLabelRef,
    targetRef,
  };
}
