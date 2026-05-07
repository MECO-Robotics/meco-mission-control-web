import { useCallback, useState } from "react";

import { IconHelp } from "@/components/shared/Icons";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import {
  HELP_SECTIONS,
  renderHelpItem,
  type InteractiveTutorialChapter,
} from "@/features/workspace/views/help/helpContent";
import { HelpTutorialModal } from "@/features/workspace/views/help/HelpTutorialModal";

interface HelpViewProps {
  tutorialInitiallyOpen?: boolean;
  tutorialInitiallyComplete?: boolean;
  onStartInteractiveTutorial?: () => void;
  onStartInteractiveTutorialChapter?: (chapterId: string) => void;
  interactiveTutorialChapters?: InteractiveTutorialChapter[];
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

  const closeTutorial = useCallback(() => {
    setIsTutorialOpen(false);
  }, []);

  const openTutorial = useCallback(() => {
    setIsTutorialOpen(true);
  }, []);

  const hasInteractiveChapterLauncher =
    Boolean(onStartInteractiveTutorialChapter) && interactiveTutorialChapters.length > 0;

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

      <HelpTutorialModal
        initialComplete={tutorialInitiallyComplete}
        initialOpen={isTutorialOpen}
        onClose={closeTutorial}
      />
    </section>
  );
}
