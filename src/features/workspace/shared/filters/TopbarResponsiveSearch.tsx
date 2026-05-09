import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

import { SearchToolbarInput } from "./workspaceSearchToolbarInput";

export function TopbarResponsiveSearch({
  ariaLabel,
  compactPlaceholder,
  compactSwitchWidth,
  iconReleaseWidth,
  iconSwitchWidth,
  mode,
  onChange,
  placeholder,
  value,
}: {
  ariaLabel: string;
  compactPlaceholder?: string;
  compactSwitchWidth?: number;
  iconReleaseWidth?: number;
  iconSwitchWidth?: number;
  mode?: "multi-state" | "dynamic-label";
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  const searchRef = useRef<HTMLDivElement>(null);
  const [isCompactOpen, setIsCompactOpen] = useState(false);
  const [isDynamicIconMode, setIsDynamicIconMode] = useState(false);
  const [searchWidth, setSearchWidth] = useState<number | null>(null);
  const compactRef = useRef<HTMLDivElement>(null);
  const resolvedMode = mode ?? "multi-state";
  const isActive = value.trim() !== "";
  const compactLabel =
    compactPlaceholder && compactPlaceholder.trim().length > 0 ? compactPlaceholder.trim() : placeholder;
  const hasCompactLabelVariant = compactLabel !== placeholder;
  const switchWidth = compactSwitchWidth ?? 132;
  const iconWidth = iconSwitchWidth ?? 86;
  const iconExitWidth = iconReleaseWidth ?? iconWidth + 12;
  const effectivePlaceholder =
    resolvedMode === "dynamic-label" &&
    hasCompactLabelVariant &&
    searchWidth !== null &&
    searchWidth <= switchWidth
      ? compactLabel
      : placeholder;

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
        className={`topbar-responsive-search topbar-responsive-search-dynamic${isDynamicIconMode ? " is-icon-mode" : ""}`}
        ref={searchRef}
      >
        {isDynamicIconMode ? (
          compactSearch
        ) : (
          <div className="topbar-responsive-search-full topbar-responsive-search-full-primary">
            <SearchToolbarInput
              ariaLabel={ariaLabel}
              onChange={onChange}
              placeholder={effectivePlaceholder}
              value={value}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="topbar-responsive-search" ref={searchRef}>
      <div className="topbar-responsive-search-full topbar-responsive-search-full-primary">
        <SearchToolbarInput
          ariaLabel={ariaLabel}
          onChange={onChange}
          placeholder={placeholder}
          value={value}
        />
      </div>
      {hasCompactLabelVariant ? (
        <div className="topbar-responsive-search-full topbar-responsive-search-full-compact">
          <SearchToolbarInput
            ariaLabel={ariaLabel}
            onChange={onChange}
            placeholder={compactLabel}
            value={value}
          />
        </div>
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
