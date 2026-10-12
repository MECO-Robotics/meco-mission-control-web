import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

import type { DropdownOption } from "../model/workspaceTypes";
import { type FilterSelection } from "./workspaceFilterUtils";
import { toggleFilterSelection } from "./workspaceFilterDropdownHooks";

export function FilterOptionMenu({
  allLabel,
  className,
  headerContent,
  getOptionToneClassName,
  menuId,
  menuRef,
  menuOffsetX,
  onChange,
  options,
  searchText,
  onSearchTextChange,
  hideSearchInput = false,
  showAllOption = true,
  singleSelect,
  style,
  value,
}: {
  allLabel: string;
  className?: string;
  headerContent?: ReactNode;
  getOptionToneClassName?: (option: DropdownOption) => string | undefined;
  menuId: string;
  menuRef: { current: HTMLDivElement | null };
  menuOffsetX: number;
  singleSelect?: boolean;
  showAllOption?: boolean;
  style?: CSSProperties;
  onChange: (value: FilterSelection) => void;
  options: DropdownOption[];
  searchText?: string;
  onSearchTextChange?: (value: string) => void;
  hideSearchInput?: boolean;
  value: FilterSelection;
}) {
  const [internalSearchText, setInternalSearchText] = useState("");
  const queryText = searchText ?? internalSearchText;
  const updateSearchText = onSearchTextChange ?? setInternalSearchText;
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = useMemo(() => {
    const query = queryText.trim().toLowerCase();
    if (!query) {
      return options;
    }

    return options.filter((option) => {
      if (option.name.toLowerCase().includes(query)) {
        return true;
      }
      return option.id.toLowerCase().includes(query);
    });
  }, [options, queryText]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raf = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-multiselectable={singleSelect ? undefined : "true"}
      className={`table-column-filter-menu${className ? ` ${className}` : ""}`}
      style={style ?? { transform: `translateX(${menuOffsetX}px)` }}
      ref={menuRef}
      id={menuId}
      role="listbox"
    >
      {headerContent ? <div role="presentation">{headerContent}</div> : null}
      {!hideSearchInput ? <div className="table-column-filter-search" role="presentation">
        <input
          aria-label={`Search ${allLabel} options`}
          className="table-column-filter-search-input"
          onChange={(milestone) => updateSearchText(milestone.target.value)}
          placeholder="Search..."
          ref={searchInputRef}
          type="text"
          value={queryText}
        />
      </div> : null}
      {showAllOption ? (
        <button
          aria-selected={value.length === 0}
          className={`table-column-filter-option${value.length === 0 ? " is-selected" : ""}`}
          onClick={(milestone) => {
            milestone.stopPropagation();
            onChange([]);
          }}
          role="option"
          type="button"
        >
          <span aria-hidden="true" className="table-column-filter-option-check">
            {value.length === 0 ? "\u2713" : ""}
          </span>
          <span>{allLabel}</span>
        </button>
      ) : null}
      {filteredOptions.length === 0 ? (
        <div className="table-column-filter-empty" role="presentation">
          No matches
        </div>
      ) : null}
      {filteredOptions.map((option) => {
        const isSelected = value.includes(option.id);
        const hasIcon = Boolean(option.icon);
        const optionToneClassName = getOptionToneClassName?.(option);

        return (
          <button
            aria-selected={isSelected}
            className={`table-column-filter-option${isSelected ? " is-selected" : ""}${hasIcon ? " has-icon" : ""}${optionToneClassName ? ` ${optionToneClassName}` : ""}`}
            key={option.id}
            onClick={(milestone) => {
              milestone.stopPropagation();
              onChange(singleSelect ? [option.id] : toggleFilterSelection(value, option.id));
            }}
            role="option"
            type="button"
          >
            <span aria-hidden="true" className="table-column-filter-option-check">
              {isSelected ? "\u2713" : ""}
            </span>
            {hasIcon ? (
              <span aria-hidden="true" className="table-column-filter-option-icon">
                {option.icon}
              </span>
            ) : null}
            <span>{option.name}</span>
          </button>
        );
      })}
    </div>
  );
}
