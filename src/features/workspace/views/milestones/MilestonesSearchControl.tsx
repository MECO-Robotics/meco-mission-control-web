import { useState, type FocusEvent, type ReactNode } from "react";

import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { MilestoneSearchHighlight } from "./MilestoneSearchHighlight";
import type { MilestoneSearchSuggestion } from "./milestonesViewUtils";

const MILESTONE_SEARCH_ACTION_OVERLAY_WIDTH = 64;
const MILESTONE_SEARCH_COMPACT_SWITCH_WIDTH = 200 + MILESTONE_SEARCH_ACTION_OVERLAY_WIDTH;
const MILESTONE_SEARCH_ICON_SWITCH_WIDTH = 86 + MILESTONE_SEARCH_ACTION_OVERLAY_WIDTH;
const MILESTONE_SEARCH_ICON_RELEASE_WIDTH = 260 + MILESTONE_SEARCH_ACTION_OVERLAY_WIDTH;

interface MilestonesSearchControlProps {
  filterControl?: ReactNode;
  searchFilter: string;
  searchSuggestions: MilestoneSearchSuggestion[];
  setSearchFilter: (value: string) => void;
}

export function MilestonesSearchControl({
  filterControl,
  searchFilter,
  searchSuggestions,
  setSearchFilter,
}: MilestonesSearchControlProps) {
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const showSuggestions = isSuggestionsOpen && searchFilter.trim() !== "" && searchSuggestions.length > 0;

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setIsSuggestionsOpen(false);
  };

  const handleSuggestionSelect = (suggestion: MilestoneSearchSuggestion) => {
    setSearchFilter(suggestion.title);
    setIsSuggestionsOpen(false);
  };

  return (
    <div
      className="milestones-search-control"
      onBlur={handleBlur}
      onFocus={(event) => {
        const target = event.target;
        if (target instanceof Element && target.closest(".topbar-responsive-search-actions")) {
          setIsSuggestionsOpen(false);
          return;
        }

        setIsSuggestionsOpen(true);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setIsSuggestionsOpen(false);
        }
      }}
    >
      <TopbarResponsiveSearch
        actionCount={filterControl ? 2 : 0}
        actions={filterControl}
        ariaLabel="Search milestones"
        compactPlaceholder="Search"
        compactSwitchWidth={MILESTONE_SEARCH_COMPACT_SWITCH_WIDTH}
        iconReleaseWidth={MILESTONE_SEARCH_ICON_RELEASE_WIDTH}
        iconSwitchWidth={MILESTONE_SEARCH_ICON_SWITCH_WIDTH}
        mode="dynamic-label"
        onChange={(value) => {
          setSearchFilter(value);
          setIsSuggestionsOpen(value.trim() !== "");
        }}
        onActionsMouseDown={() => setIsSuggestionsOpen(false)}
        placeholder="Search milestones..."
        value={searchFilter}
      />

      {showSuggestions ? (
        <div aria-label="Milestone search suggestions" className="milestones-search-suggestions" role="listbox">
          {searchSuggestions.map((suggestion) => (
            <button
              className="milestones-search-suggestion"
              key={suggestion.id}
              onClick={() => handleSuggestionSelect(suggestion)}
              onMouseDown={(event) => event.preventDefault()}
              role="option"
              type="button"
            >
              <span className="milestones-search-suggestion-title">
                <MilestoneSearchHighlight searchFilter={searchFilter} text={suggestion.title} />
              </span>
              <span className="milestones-search-suggestion-context">
                <MilestoneSearchHighlight searchFilter={searchFilter} text={suggestion.context} />
              </span>
              {suggestion.description ? (
                <span className="milestones-search-suggestion-description">
                  <MilestoneSearchHighlight searchFilter={searchFilter} text={suggestion.description} />
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
