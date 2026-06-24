import { Search } from "lucide-react";
import type { CSSProperties, Dispatch, ReactNode, RefObject, SetStateAction } from "react";

import { SearchToolbarInput } from "../workspaceSearchToolbarInput";

type TopbarResponsiveSearchLayoutProps = {
  actions?: ReactNode;
  ariaLabel: string;
  compactLabel: string;
  compactRef: RefObject<HTMLDivElement | null>;
  hasCompactLabelVariant: boolean;
  isActive: boolean;
  isCompactOpen: boolean;
  isDynamicMode: boolean;
  isIconMode: boolean;
  onActionsMouseDown?: () => void;
  onChange: (value: string) => void;
  placeholder: string;
  resolvedPlaceholder: string;
  rootClassName: string;
  rootStyle?: CSSProperties;
  searchInputRef: RefObject<HTMLInputElement | null>;
  searchRef: RefObject<HTMLDivElement | null>;
  setIsCompactOpen: Dispatch<SetStateAction<boolean>>;
  tutorialTarget?: string;
  value: string;
};

export function TopbarResponsiveSearchLayout({
  actions,
  ariaLabel,
  compactLabel,
  compactRef,
  hasCompactLabelVariant,
  isActive,
  isCompactOpen,
  isDynamicMode,
  isIconMode,
  onActionsMouseDown,
  onChange,
  placeholder,
  resolvedPlaceholder,
  rootClassName,
  rootStyle,
  searchInputRef,
  searchRef,
  setIsCompactOpen,
  tutorialTarget,
  value,
}: TopbarResponsiveSearchLayoutProps) {
  const renderActions = (classNameSuffix = "") =>
    actions ? (
      <div className={`topbar-responsive-search-actions${classNameSuffix}`} onMouseDown={onActionsMouseDown}>
        {actions}
      </div>
    ) : null;
  const renderFullSearch = (currentPlaceholder: string, variantClassName: string) => (
    <div className={`topbar-responsive-search-full ${variantClassName}`}>
      <div className="topbar-responsive-search-field">
        <SearchToolbarInput
          ariaLabel={ariaLabel}
          inputRef={searchInputRef}
          onChange={onChange}
          placeholder={currentPlaceholder}
          value={value}
        />
        {renderActions()}
      </div>
    </div>
  );
  const renderIconOnlySearch = () => (
    <div className="topbar-responsive-search-full topbar-responsive-search-full-primary topbar-responsive-search-full-icon-only">
      <div className="topbar-responsive-search-field">
        <SearchToolbarInput
          ariaLabel={ariaLabel}
          inputRef={searchInputRef}
          onChange={onChange}
          onSearchIconActivate={() => {
            searchInputRef.current?.focus();
          }}
          placeholder=""
          value={value}
        />
        {renderActions(" topbar-responsive-search-actions-compact")}
      </div>
    </div>
  );

  if (isDynamicMode) {
    return (
      <div
        className={`${rootClassName} topbar-responsive-search-dynamic${isIconMode ? " is-icon-mode" : ""}`}
        data-tutorial-target={tutorialTarget}
        ref={searchRef}
        style={rootStyle}
      >
        {isIconMode ? renderIconOnlySearch() : renderFullSearch(resolvedPlaceholder, "topbar-responsive-search-full-primary")}
      </div>
    );
  }

  return (
    <div className={rootClassName} data-tutorial-target={tutorialTarget} ref={searchRef} style={rootStyle}>
      {renderFullSearch(placeholder, "topbar-responsive-search-full-primary")}
      {hasCompactLabelVariant ? renderFullSearch(compactLabel, "topbar-responsive-search-full-compact") : null}

      <div className={`topbar-responsive-search-compact${isCompactOpen ? " is-open" : ""}`} ref={compactRef}>
        <button
          aria-expanded={isCompactOpen}
          aria-haspopup="dialog"
          aria-label={ariaLabel}
          className={`icon-button app-topbar-icon-button topbar-responsive-search-toggle${isActive ? " is-active" : ""}`}
          onClick={() => setIsCompactOpen((current) => !current)}
          title={ariaLabel}
          type="button"
        >
          <Search size={14} strokeWidth={2} />
        </button>
        {renderActions(" topbar-responsive-search-actions-compact")}
        {isCompactOpen ? (
          <div className="topbar-responsive-search-popover">
            <input
              aria-label={ariaLabel}
              className="toolbar-search-input"
              onChange={(event) => onChange(event.target.value)}
              placeholder={placeholder}
              type="search"
              value={value}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
