import {
  Children,
  Fragment,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Search } from "lucide-react";

import { SearchToolbarInput } from "./workspaceSearchToolbarInput";

function countActionNodes(actions: ReactNode): number {
  let count = 0;

  Children.forEach(actions, (child) => {
    if (child === null || child === undefined || typeof child === "boolean") {
      return;
    }

    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      count += countActionNodes(child.props.children);
      return;
    }

    count += 1;
  });

  return count;
}

export function TopbarResponsiveSearch({
  actionCount,
  actions,
  ariaLabel,
  className,
  compactPlaceholder,
  compactSwitchWidth,
  iconReleaseWidth,
  iconSwitchWidth,
  mode,
  onActionsMouseDown,
  onChange,
  placeholder,
  tutorialTarget,
  value,
}: {
  actionCount?: number;
  actions?: ReactNode;
  ariaLabel: string;
  className?: string;
  compactPlaceholder?: string;
  compactSwitchWidth?: number;
  iconReleaseWidth?: number;
  iconSwitchWidth?: number;
  mode?: "multi-state" | "dynamic-label";
  onActionsMouseDown?: () => void;
  onChange: (value: string) => void;
  placeholder: string;
  tutorialTarget?: string;
  value: string;
}) {
  const searchRef = useRef<HTMLDivElement>(null);
  const [isCompactOpen, setIsCompactOpen] = useState(false);
  const [isDynamicIconMode, setIsDynamicIconMode] = useState(false);
  const [searchWidth, setSearchWidth] = useState<number | null>(null);
  const compactRef = useRef<HTMLDivElement>(null);
  const resolvedMode = mode ?? "dynamic-label";
  const isActive = value.trim() !== "";
  const compactLabel =
    compactPlaceholder && compactPlaceholder.trim().length > 0 ? compactPlaceholder.trim() : "Search";
  const hasCompactLabelVariant = compactLabel !== placeholder;
  const resolvedActionCount = actions ? Math.max(1, actionCount ?? countActionNodes(actions)) : 0;
  const actionOverlayWidthPx = resolvedActionCount * 32;
  const switchWidth = compactSwitchWidth ?? 132 + actionOverlayWidthPx;
  const iconWidth = iconSwitchWidth ?? 86 + actionOverlayWidthPx;
  const iconExitWidth = iconReleaseWidth ?? iconWidth + 12;
  const effectivePlaceholder =
    resolvedMode === "dynamic-label" &&
    hasCompactLabelVariant &&
    searchWidth !== null &&
    searchWidth <= switchWidth
      ? compactLabel
      : placeholder;
  const rootClassName = `topbar-responsive-search${actions ? " has-actions" : ""}${className ? ` ${className}` : ""}`;
  const rootStyle =
    resolvedActionCount > 0
      ? ({
          "--topbar-responsive-search-action-overlay-width": `${resolvedActionCount * 2}rem`,
          "--topbar-responsive-search-icon-pill-extra-width": "1rem",
          "--topbar-responsive-search-icon-pill-reserved-width": `${resolvedActionCount * 2}rem`,
        } as CSSProperties)
      : undefined;
  const renderActions = (classNameSuffix = "") =>
    actions ? (
      <div
        className={`topbar-responsive-search-actions${classNameSuffix}`}
        onMouseDown={onActionsMouseDown}
      >
        {actions}
      </div>
    ) : null;
  const renderFullSearch = (currentPlaceholder: string, variantClassName: string) => (
    <div className={`topbar-responsive-search-full ${variantClassName}`}>
      <div className="topbar-responsive-search-field">
        <SearchToolbarInput
          ariaLabel={ariaLabel}
          onChange={onChange}
          placeholder={currentPlaceholder}
          value={value}
        />
        {renderActions()}
      </div>
    </div>
  );

  useEffect(() => {
    if (!isCompactOpen || typeof document === "undefined") {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Node && !compactRef.current?.contains(target)) {
        setIsCompactOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCompactOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCompactOpen]);

  useEffect(() => {
    if (resolvedMode !== "dynamic-label" || typeof ResizeObserver === "undefined") {
      return;
    }

    const element = searchRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const [entry] = entries;
      if (!entry) {
        return;
      }
      setSearchWidth(entry.contentRect.width);
    });

    observer.observe(element);
    setSearchWidth(element.clientWidth);

    return () => {
      observer.disconnect();
    };
  }, [resolvedMode]);

  useEffect(() => {
    if (resolvedMode !== "dynamic-label" || searchWidth === null) {
      setIsDynamicIconMode(false);
      return;
    }

    setIsDynamicIconMode((current) => {
      if (current) {
        return searchWidth < iconExitWidth;
      }
      return searchWidth <= iconWidth;
    });
  }, [iconExitWidth, iconWidth, resolvedMode, searchWidth]);

  useEffect(() => {
    if (!isDynamicIconMode) {
      setIsCompactOpen(false);
    }
  }, [isDynamicIconMode]);

  if (resolvedMode === "dynamic-label") {
    const compactSearch = (
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
    );

    return (
      <div
        className={`${rootClassName} topbar-responsive-search-dynamic${isDynamicIconMode ? " is-icon-mode" : ""}`}
        data-tutorial-target={tutorialTarget}
        ref={searchRef}
        style={rootStyle}
      >
        {isDynamicIconMode ? (
          compactSearch
        ) : (
          renderFullSearch(effectivePlaceholder, "topbar-responsive-search-full-primary")
        )}
      </div>
    );
  }

  return (
    <div className={rootClassName} data-tutorial-target={tutorialTarget} ref={searchRef} style={rootStyle}>
      {renderFullSearch(placeholder, "topbar-responsive-search-full-primary")}
      {hasCompactLabelVariant ? (
        renderFullSearch(compactLabel, "topbar-responsive-search-full-compact")
      ) : null}

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
