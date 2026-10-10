import { useCallback, useMemo, useState } from "react";

import { IconHelp } from "@/components/shared/Icons";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { WorkspaceSortMenu } from "@/features/workspace/shared/filters/WorkspaceSortMenu";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import {
  HELP_SECTIONS,
  getHelpItemText,
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
  const [searchFilter, setSearchFilter] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [sortField, setSortField] = useState("curated");

  const closeTutorial = useCallback(() => {
    setIsTutorialOpen(false);
  }, []);

  const openTutorial = useCallback(() => {
    setIsTutorialOpen(true);
  }, []);

  const hasInteractiveChapterLauncher =
    Boolean(onStartInteractiveTutorialChapter) && interactiveTutorialChapters.length > 0;
  const filteredHelpSections = useMemo(() => {
    const normalizedSearch = searchFilter.trim().toLowerCase();
    const sections = normalizedSearch.length === 0 ? HELP_SECTIONS : HELP_SECTIONS
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          [section.title, getHelpItemText(item)].join(" ").toLowerCase().includes(normalizedSearch),
        ),
      }))
      .filter((section) => section.items.length > 0);
    if (sortField === "curated") return sections;
    const direction = sortDirection === "asc" ? 1 : -1;
    return sections.map((section) => ({
      ...section,
      items: [...section.items].sort((a, b) => getHelpItemText(a).localeCompare(getHelpItemText(b)) * direction),
    })).sort((a, b) => a.title.localeCompare(b.title) * direction);
  }, [searchFilter, sortDirection, sortField]);

  return (
    <section className={`panel dense-panel help-page ${WORKSPACE_PANEL_CLASS}`}>
      <AppTopbarSlotPortal slot="controls">
        <div className="panel-actions filter-toolbar help-toolbar">
          <TopbarResponsiveSearch
            actions={<WorkspaceSortMenu direction={sortDirection} field={sortField} label="help topics" onDirectionChange={setSortDirection} onFieldChange={setSortField} options={[{ label: "Featured order", value: "curated" }, { label: "Alphabetical", value: "alphabetical" }]} />}
            ariaLabel="Search help"
            compactPlaceholder="Search"
            onChange={setSearchFilter}
            placeholder="Search help..."
            value={searchFilter}
          />
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
      </AppTopbarSlotPortal>

      {hasInteractiveChapterLauncher ? (
        <div className="panel-subsection help-doc-section">
          <h2>Interactive tutorial chapters</h2>
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
        {filteredHelpSections.map((section) => (
          <article className="help-doc-section" key={section.title}>
            <h2>{section.title}</h2>
            <ul>
              {section.items.map((item) => (
                <li key={typeof item === "string" ? item : item.href}>{renderHelpItem(item)}</li>
              ))}
            </ul>
          </article>
        ))}
        {filteredHelpSections.length === 0 ? (
          <p className="empty-state">No help topics match the current search.</p>
        ) : null}
      </div>

      <HelpTutorialModal
        initialComplete={tutorialInitiallyComplete}
        initialOpen={isTutorialOpen}
        onClose={closeTutorial}
      />
    </section>
  );
}
