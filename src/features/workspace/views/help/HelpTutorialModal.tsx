import { useEffect, useRef, useState } from "react";

import { IconChevronLeft, IconChevronRight } from "@/components/shared/Icons";
import { HELP_TUTORIAL_STEPS } from "@/features/workspace/views/help/helpContent";

interface HelpTutorialModalProps {
  initialOpen: boolean;
  initialComplete: boolean;
  onClose: () => void;
}

export function HelpTutorialModal({
  initialComplete,
  initialOpen,
  onClose,
}: HelpTutorialModalProps) {
  const [activeTutorialStep, setActiveTutorialStep] = useState(0);
  const [isTutorialComplete, setIsTutorialComplete] = useState(
    initialOpen && initialComplete,
  );
  const closeTutorialButtonRef = useRef<HTMLButtonElement | null>(null);
  const wasOpenRef = useRef(initialOpen);

  useEffect(() => {
    if (initialOpen && !wasOpenRef.current) {
      setActiveTutorialStep(0);
      setIsTutorialComplete(false);
    }

    wasOpenRef.current = initialOpen;
  }, [initialOpen]);

  useEffect(() => {
    if (!initialOpen) {
      return;
    }

    closeTutorialButtonRef.current?.focus();

    const handleKeyDown = (milestone: KeyboardEvent) => {
      if (milestone.key === "Escape") {
        milestone.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [initialOpen, onClose]);

  if (!initialOpen) {
    return null;
  }

  const currentStep = HELP_TUTORIAL_STEPS[activeTutorialStep] ?? HELP_TUTORIAL_STEPS[0];
  const isLastStep = activeTutorialStep === HELP_TUTORIAL_STEPS.length - 1;
  const progressPercent = isTutorialComplete
    ? 100
    : ((activeTutorialStep + 1) / HELP_TUTORIAL_STEPS.length) * 100;

  const goToPreviousStep = () => {
    if (isTutorialComplete) {
      setIsTutorialComplete(false);
      setActiveTutorialStep(HELP_TUTORIAL_STEPS.length - 1);
      return;
    }

    setActiveTutorialStep((current) => Math.max(0, current - 1));
  };

  const goToNextStep = () => {
    if (isTutorialComplete) {
      setActiveTutorialStep(0);
      setIsTutorialComplete(false);
      return;
    }

    if (isLastStep) {
      setIsTutorialComplete(true);
      return;
    }

    setActiveTutorialStep((current) =>
      Math.min(HELP_TUTORIAL_STEPS.length - 1, current + 1),
    );
  };

  const closeTutorial = () => {
    setActiveTutorialStep(0);
    setIsTutorialComplete(false);
    onClose();
  };

  return (
    <div
      className="modal-scrim help-tutorial-scrim"
      onClick={(milestone) => {
        if (milestone.target === milestone.currentTarget) {
          closeTutorial();
        }
      }}
      role="presentation"
    >
      <section
        aria-describedby="help-tutorial-description"
        aria-labelledby="help-tutorial-title"
        aria-modal="true"
        className="modal-card help-tutorial-modal"
        id="help-tutorial-dialog"
        onClick={(milestone) => milestone.stopPropagation()}
        role="dialog"
      >
        <div className="panel-header compact-header help-tutorial-modal-header">
          <div className="queue-section-header">
            <p className="eyebrow">Interactive walkthrough</p>
            <h2 id="help-tutorial-title">Guided workspace tutorial</h2>
            <p className="section-copy" id="help-tutorial-description">
              Follow the same scope-create-filter-recover loop teams use day to day.
            </p>
          </div>
          <button
            ref={closeTutorialButtonRef}
            className="icon-button"
            onClick={closeTutorial}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="help-tutorial-progress" aria-hidden="true">
          <span style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="help-tutorial-layout">
          <ol className="help-tutorial-step-list" aria-label="Tutorial steps">
            {HELP_TUTORIAL_STEPS.map((step, index) => {
              const stepNumber = index + 1;
              const isActive = index === activeTutorialStep;

              return (
                <li key={step.title}>
                  <button
                    aria-current={isActive && !isTutorialComplete ? "step" : undefined}
                    className="help-tutorial-step-button"
                    data-active={isActive && !isTutorialComplete}
                    onClick={() => {
                      setActiveTutorialStep(index);
                      setIsTutorialComplete(false);
                    }}
                    type="button"
                  >
                    <span className="help-tutorial-step-number">{stepNumber}</span>
                    <span>{step.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          {isTutorialComplete ? (
            <article className="help-tutorial-step-card" data-tutorial-state="complete">
              <p className="eyebrow">Tutorial complete</p>
              <h3>You are ready to run the workspace loop</h3>
              <p>
                You have covered scope selection, tab routing, edit flow, filtering, roster,
                and stale-state recovery.
              </p>
              <ul>
                <li>Close this tutorial and apply the same sequence in your current tab.</li>
                <li>Restart the tutorial if you want a quick refresher with the same steps.</li>
                <li>Use the help sections below for deeper reference while working.</li>
              </ul>
              <div className="help-tutorial-cue">
                <span>Next move</span>
                <p>
                  In real usage: set scope first, create or edit, then filter and refresh only
                  when needed.
                </p>
              </div>
            </article>
          ) : (
            <article className="help-tutorial-step-card">
              <p className="eyebrow">
                Step {activeTutorialStep + 1} of {HELP_TUTORIAL_STEPS.length}
              </p>
              <h3>{currentStep.title}</h3>
              <p>{currentStep.summary}</p>
              <ul>
                {currentStep.actions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
              <div className="help-tutorial-cue">
                <span>Workspace cue</span>
                <p>{currentStep.cue}</p>
              </div>
            </article>
          )}
        </div>

        <div className="modal-actions help-tutorial-actions">
          <button
            className="secondary-action"
            disabled={activeTutorialStep === 0 && !isTutorialComplete}
            onClick={goToPreviousStep}
            type="button"
          >
            <IconChevronLeft />
            {isTutorialComplete ? "Review last step" : "Back"}
          </button>
          <button className="secondary-action" onClick={closeTutorial} type="button">
            Close tutorial
          </button>
          <button className="primary-action" onClick={goToNextStep} type="button">
            {isTutorialComplete ? "Start again" : isLastStep ? "Complete tutorial" : "Next step"}
            {!isTutorialComplete && !isLastStep ? <IconChevronRight /> : null}
          </button>
        </div>
      </section>
    </div>
  );
}
