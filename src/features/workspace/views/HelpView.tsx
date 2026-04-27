import { useCallback, useEffect, useRef, useState } from "react";

import { IconChevronLeft, IconChevronRight, IconHelp } from "@/components/shared";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared";

const HELP_SECTIONS: Array<{ title: string; items: string[] }> = [
  {
    title: "Start with scope",
    items: [
      "Before editing anything, check the **season selector** in the profile menu and the **active project** in the sidebar.",
      "Pick **All projects** only for planning sweeps; switch back to a single project before data entry.",
      "If a list looks empty, first confirm you are in the expected **season and project scope**.",
      "Timeline, Queue, and Milestones are **project-aware**, so scope mistakes show up there first.",
    ],
  },
  {
    title: "Know what each tab is for",
    items: [
      "Tasks is where scheduling and execution stay aligned: Timeline for dates, Queue for active work, and Milestones for checkpoints.",
      "Manufacturing only appears in **robot projects**, split into CNC, prints, and fabrication queues.",
      "Reports is always available and groups the **QA** and **Event Result** forms in one sidebar page.",
      "Inventory changes by project type: **robot projects use Materials and Parts, non-robot projects use Documents**.",
      "Workflow replaces Subsystems for non-robot projects, but the ownership flow stays the same.",
      "Roster and Help are **always available** no matter which project is selected.",
    ],
  },
  {
    title: "Use the edit flow consistently",
    items: [
      "Create from the Add button in the current view, then come back by clicking the row or card to edit.",
      "The **hover pencil is a cue only**; the row or card itself is the actual click target.",
      "Keep updates and deletes **inside the edit modal** so changes are made in one place.",
      "If an **Add button is disabled**, you are usually missing season or project scope.",
      "Apply ownership and status changes before date changes to keep queue and timeline views in sync.",
    ],
  },
  {
    title: "Filter without losing context",
    items: [
      "Start with search when you know a task name, part number, vendor, or owner.",
      "Layer dropdown filters after search; stacking too many at once can hide expected rows.",
      "Use roster person filtering to trace one contributor across task and inventory surfaces.",
      "After someone else edits data, **use refresh** before assuming your filter is wrong.",
      "Status chips and row badges are the fastest way to spot blocked or stale work.",
    ],
  },
  {
    title: "Roster and permission checks",
    items: [
      "Students, Mentors, and External access are separate on purpose; keep assignments in the right group.",
      "Clicking a roster member sets a person filter in views that support person-scoped data.",
      "Maintain **email, role, and elevated lead/core mentor access** from the roster edit popups.",
      "If ownership choices look wrong in another tab, verify the roster record first.",
    ],
  },
  {
    title: "Sign-in and session behavior",
    items: [
      "Available sign-in methods come from **server config**: Google, email-code, or local dev bypass.",
      "Google auth requires **localhost or HTTPS** with matching allowed origins in Google Cloud.",
      "Email-code login only works with a **valid team address** and the active one-time code.",
      "When a session expires, **sign in again and refresh once** before retrying failed edits.",
    ],
  },
  {
    title: "Fast troubleshooting pass",
    items: [
      "**No data:** verify season, project, and person filter in that order.",
      "**Save failed:** refresh workspace data and retry once before making more edits.",
      "**Cannot sign in:** check backend status and auth config before changing browser settings.",
      "**Filters feel stuck:** clear search and dropdowns, then switch tabs once to reset local view state.",
    ],
  },
];

function renderHelpItem(item: string) {
  const parts = item.split("**");
  if (parts.length === 1) {
    return item;
  }

  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong key={`strong-${index}`}>{part}</strong>
    ) : (
      <span key={`text-${index}`}>{part}</span>
    ),
  );
}

const HELP_TUTORIAL_STEPS: Array<{
  title: string;
  summary: string;
  actions: string[];
  cue: string;
}> = [
  {
    title: "Set season and project first",
    summary:
      "Every reliable workflow starts with correct scope. Confirm season and project before creating or editing records.",
    actions: [
      "Open the profile menu and confirm the active season.",
      "Set project scope in the sidebar (Robot, Outreach, Operations, or All projects).",
      "Switch out of All projects before entering detailed task or inventory data.",
    ],
    cue: "Wrong scope is the most common reason data looks missing.",
  },
  {
    title: "Read the shell and subtabs",
    summary:
      "The sidebar picks the area; some areas use subtabs in the top bar, while Reports keeps its launchers on the page.",
    actions: [
      "Open Tasks and move through Timeline, Queue, and Milestones.",
      "Open Reports to launch QA and Event Result forms from one place in the sidebar.",
      "Switch projects and watch Inventory move between Materials/Parts and Documents.",
      "Check footer notes at the bottom of each view for local interaction hints.",
    ],
    cue: "If a control seems missing, you are often in the wrong subtab, not the wrong tab.",
  },
  {
    title: "Create, then edit in place",
    summary:
      "The core loop is consistent: Add from the toolbar, then return by clicking rows or cards to edit.",
    actions: [
      "Create a new item from the Add button in the active view.",
      "Hover for the pencil cue, then click the row/card itself.",
      "Apply edits and deletes from the edit modal to keep record history consistent.",
    ],
    cue: "Disabled Add buttons usually mean missing scope, not missing permissions.",
  },
  {
    title: "Filter deliberately",
    summary:
      "Use filters in order so you do not accidentally hide expected items.",
    actions: [
      "Search first when you know a title, owner, vendor, or material.",
      "Then add dropdown filters for status, subsystem, requester, or approval.",
      "Use roster person filtering when tracing one person across multiple tabs.",
    ],
    cue: "Empty list after filtering usually means filters are too specific, not missing data.",
  },
  {
    title: "Use roster as a control surface",
    summary:
      "Roster is not just reference data; it controls assignment quality and person-based filtering.",
    actions: [
      "Keep Students, Mentors, and External access in the correct buckets.",
      "Click a roster member to apply person filtering where supported.",
      "Maintain email, role, and elevated lead/core mentor status from roster popups.",
    ],
    cue: "If assignment dropdowns look wrong, fix the roster record before editing tasks.",
  },
  {
    title: "Recover from stale state quickly",
    summary:
      "When behavior feels off, reset the smallest likely cause before making more edits.",
    actions: [
      "Clear search/filters and switch tabs once if a list appears stuck.",
      "Use refresh after another user or device updates shared records.",
      "If save fails, refresh and retry once before changing more fields.",
    ],
    cue: "Scope, filters, and stale cache explain most confusing states in this app.",
  },
];

interface HelpViewProps {
  tutorialInitiallyOpen?: boolean;
  tutorialInitiallyComplete?: boolean;
  onStartInteractiveTutorial?: () => void;
  onStartInteractiveTutorialChapter?: (chapterId: string) => void;
  interactiveTutorialChapters?: Array<{
    id: string;
    title: string;
    summary: string;
    completed?: boolean;
  }>;
  isInteractiveTutorialActive?: boolean;
}

export function HelpView({
  tutorialInitiallyOpen = false,
  tutorialInitiallyComplete = false,
  onStartInteractiveTutorial,
  onStartInteractiveTutorialChapter,
  interactiveTutorialChapters = [],
  isInteractiveTutorialActive = false,
}: HelpViewProps) {
  const [isTutorialOpen, setIsTutorialOpen] = useState(tutorialInitiallyOpen);
  const [activeTutorialStep, setActiveTutorialStep] = useState(0);
  const [isTutorialComplete, setIsTutorialComplete] = useState(
    tutorialInitiallyOpen && tutorialInitiallyComplete,
  );
  const closeTutorialButtonRef = useRef<HTMLButtonElement | null>(null);

  const closeTutorial = useCallback(() => {
    setIsTutorialOpen(false);
    setActiveTutorialStep(0);
    setIsTutorialComplete(false);
  }, []);

  const openTutorial = () => {
    setActiveTutorialStep(0);
    setIsTutorialComplete(false);
    setIsTutorialOpen(true);
  };

  useEffect(() => {
    if (!isTutorialOpen) {
      return;
    }

    closeTutorialButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeTutorial();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeTutorial, isTutorialOpen]);

  const currentStep = HELP_TUTORIAL_STEPS[activeTutorialStep] ?? HELP_TUTORIAL_STEPS[0];
  const isLastStep = activeTutorialStep === HELP_TUTORIAL_STEPS.length - 1;
  const hasInteractiveChapterLauncher =
    Boolean(onStartInteractiveTutorialChapter) && interactiveTutorialChapters.length > 0;
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

  return (
    <section className={`panel dense-panel help-page ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Help documentation</h2>
          <p className="section-copy">
            Practical operating notes for scope, edit flow, filters, access, and recovery.
          </p>
        </div>
        <button
          aria-controls={onStartInteractiveTutorial ? undefined : "help-tutorial-dialog"}
          className="primary-action help-tutorial-launch"
          data-tutorial-launch="help"
          disabled={isInteractiveTutorialActive}
          onClick={() => {
            if (hasInteractiveChapterLauncher && onStartInteractiveTutorialChapter) {
              onStartInteractiveTutorialChapter(interactiveTutorialChapters[0].id);
              return;
            }

            if (onStartInteractiveTutorial) {
              onStartInteractiveTutorial();
              return;
            }

            openTutorial();
          }}
          type="button"
        >
          <IconHelp />
          {hasInteractiveChapterLauncher ? "Start chapter 1" : "Start tutorial"}
        </button>
      </div>

      {hasInteractiveChapterLauncher ? (
        <div className="panel-subsection help-doc-section">
          <h3>Interactive tutorial chapters</h3>
          <p>
            Start any chapter directly. At the end of each chapter, you can end or continue.
          </p>
          <div style={{ display: "grid", gap: "0.6rem", marginTop: "0.6rem" }}>
            {interactiveTutorialChapters.map((chapter, index) => (
              <article className="help-doc-section" key={chapter.id} style={{ margin: 0 }}>
                <h3 style={{ marginBottom: "0.35rem" }}>
                  Chapter {index + 1}: {chapter.title}
                </h3>
                <p>{chapter.summary}</p>
                <button
                  className="secondary-action"
                  disabled={isInteractiveTutorialActive}
                  onClick={() => onStartInteractiveTutorialChapter?.(chapter.id)}
                  type="button"
                >
                  {chapter.completed ? "Restart chapter" : "Start chapter"}
                </button>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <div className="panel-subsection help-docs-list">
        {HELP_SECTIONS.map((section) => (
          <article className="help-doc-section" key={section.title}>
            <h3>{section.title}</h3>
            <ul>
              {section.items.map((item) => (
                <li key={item}>{renderHelpItem(item)}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      {isTutorialOpen ? (
        <div
          className="modal-scrim help-tutorial-scrim"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
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
            onClick={(event) => event.stopPropagation()}
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
      ) : null}
    </section>
  );
}
