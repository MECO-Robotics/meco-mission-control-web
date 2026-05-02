import type { CSSProperties } from "react";

import type { InteractiveTutorialOverlayProps } from "./interactiveTutorialTypes";

function toDimStyle(
  spotlightBounds: { top: number; left: number; right: number; bottom: number } | null,
  spotlightRect: InteractiveTutorialOverlayProps["spotlightRect"],
) {
  if (!spotlightBounds || !spotlightRect) {
    return { className: "interactive-tutorial-dim", style: { inset: 0 } as CSSProperties };
  }

  return null;
}

export function InteractiveTutorialOverlay({
  chapterTitle,
  completedChapterTitle,
  currentStep,
  hasNextChapter,
  isCreationStep,
  isTargetReady,
  onClose,
  onContinue,
  projectName,
  seasonName,
  spotlightRect,
  stepCount,
  stepError,
  stepNumber,
}: InteractiveTutorialOverlayProps) {
  const spotlightBounds = spotlightRect
    ? {
        top: Math.max(0, spotlightRect.top),
        left: Math.max(0, spotlightRect.left),
        right: Math.max(0, spotlightRect.left + spotlightRect.width),
        bottom: Math.max(0, spotlightRect.top + spotlightRect.height),
      }
    : null;

  const dimFallback = toDimStyle(spotlightBounds, spotlightRect);

  return (
    <aside aria-label="Interactive tutorial" className="interactive-tutorial-overlay" role="dialog">
      {spotlightRect && spotlightBounds ? (
        <>
          <div
            className="interactive-tutorial-dim"
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: `${spotlightBounds.top}px`,
            }}
          />
          <div
            className="interactive-tutorial-dim"
            style={{
              top: `${spotlightBounds.top}px`,
              left: 0,
              width: `${spotlightBounds.left}px`,
              height: `${spotlightRect.height}px`,
            }}
          />
          <div
            className="interactive-tutorial-dim"
            style={{
              top: `${spotlightBounds.top}px`,
              left: `${spotlightBounds.right}px`,
              right: 0,
              height: `${spotlightRect.height}px`,
            }}
          />
          <div
            className="interactive-tutorial-dim"
            style={{
              top: `${spotlightBounds.bottom}px`,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <div
            className="interactive-tutorial-spotlight"
            style={{
              top: `${spotlightRect.top}px`,
              left: `${spotlightRect.left}px`,
              width: `${spotlightRect.width}px`,
              height: `${spotlightRect.height}px`,
            }}
          />
        </>
      ) : (
        <div className={dimFallback?.className ?? "interactive-tutorial-dim"} style={dimFallback?.style} />
      )}

      <section className="interactive-tutorial-card">
        {currentStep ? (
          <>
            <div className="interactive-tutorial-header">
              <p className="eyebrow">Interactive tutorial</p>
              <p className="interactive-tutorial-progress">
                {chapterTitle}: Step {stepNumber} of {stepCount}
              </p>
            </div>
            <h3>{currentStep.title}</h3>
            <p>{currentStep.instruction}</p>
            <p className="interactive-tutorial-context">
              Fake tutorial season: {seasonName ?? "Tutorial season"}
            </p>
            {projectName ? (
              <p className="interactive-tutorial-context">Tutorial project: {projectName}</p>
            ) : null}
            <p className="interactive-tutorial-hint">
              {isTargetReady
                ? isCreationStep
                  ? "Use Add, complete the modal, and save to continue."
                  : "Use the highlighted control to continue."
                : "Waiting for the next highlighted control to appear..."}
            </p>
            {stepError ? <p className="interactive-tutorial-error">{stepError}</p> : null}
            <div className="interactive-tutorial-actions">
              <button className="secondary-action" onClick={onClose} type="button">
                End tutorial
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="interactive-tutorial-header">
              <p className="eyebrow">Chapter complete</p>
              <p className="interactive-tutorial-progress">{completedChapterTitle}</p>
            </div>
            <h3>Continue to the next chapter?</h3>
            <p>
              This chapter is complete. You can end the tutorial now or continue with the next
              chapter.
            </p>
            <div className="interactive-tutorial-actions">
              <button className="secondary-action" onClick={onClose} type="button">
                End tutorial
              </button>
              {hasNextChapter ? (
                <button className="primary-action" onClick={onContinue} type="button">
                  Continue to next chapter
                </button>
              ) : (
                <button className="primary-action" onClick={onClose} type="button">
                  Finish tutorial
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </aside>
  );
}
