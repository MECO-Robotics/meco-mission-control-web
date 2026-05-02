import { createPortal } from "react-dom";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { IconFilter, IconTasks } from "@/components/shared";

import type { DropdownOption } from "./workspaceTypes";
import {
  type FilterSelection,
  formatFilterSelectionLabel,
  getPortalMenuPosition,
  pruneFilterSelection,
} from "./workspaceFilterUtils";
export { CompactFilterMenu, type CompactFilterMenuItem } from "./workspaceCompactFilterMenu";

function toggleFilterSelection(selection: FilterSelection, value: string) {
  return selection.includes(value)
    ? selection.filter((selectedValue) => selectedValue !== value)
    : [...selection, value];
}

function usePrunedFilterSelection(
  value: FilterSelection,
  options: DropdownOption[],
  onChange: (value: FilterSelection) => void,
) {
  useEffect(() => {
    const prunedValue = pruneFilterSelection(value, options);
    if (prunedValue.length !== value.length || prunedValue.some((item, index) => item !== value[index])) {
      onChange(prunedValue);
    }
  }, [onChange, options, value]);
}

function FilterOptionMenu({
  allLabel,
  className,
  menuId,
  menuRef,
  menuOffsetX,
  style,
  getOptionToneClassName,
  showAllOption = true,
  singleSelect,
  onChange,
  options,
  value,
}: {
  allLabel: string;
  className?: string;
  getOptionToneClassName?: (option: DropdownOption) => string | undefined;
  menuId: string;
  menuRef: { current: HTMLDivElement | null };
  menuOffsetX: number;
  singleSelect?: boolean;
  showAllOption?: boolean;
  style?: CSSProperties;
  onChange: (value: FilterSelection) => void;
  options: DropdownOption[];
  value: FilterSelection;
}) {
  const [searchText, setSearchText] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) {
      return options;
    }

    return options.filter((option) => {
      if (option.name.toLowerCase().includes(query)) {
        return true;
      }
      return option.id.toLowerCase().includes(query);
    });
  }, [options, searchText]);

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
      <div className="table-column-filter-search" role="presentation">
        <input
          aria-label={`Search ${allLabel} options`}
          className="table-column-filter-search-input"
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search..."
          ref={searchInputRef}
          type="text"
          value={searchText}
        />
      </div>
      {showAllOption ? (
        <button
          aria-selected={value.length === 0}
          className={`table-column-filter-option${value.length === 0 ? " is-selected" : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            onChange([]);
          }}
          role="option"
          type="button"
        >
          <span aria-hidden="true" className="table-column-filter-option-check">
            {value.length === 0 ? "✓" : ""}
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

        return (
          <button
            aria-selected={isSelected}
            className={`table-column-filter-option${isSelected ? " is-selected" : ""}${hasIcon ? " has-icon" : ""}${getOptionToneClassName?.(option) ? ` ${getOptionToneClassName(option)}` : ""}`}
            key={option.id}
            onClick={(event) => {
              event.stopPropagation();
              onChange(singleSelect ? [option.id] : toggleFilterSelection(value, option.id));
            }}
            role="option"
            type="button"
          >
            <span aria-hidden="true" className="table-column-filter-option-check">
              {isSelected ? "✓" : ""}
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

export function FilterDropdown({
  allLabel,
  ariaLabel,
  className,
  buttonDataTutorialTarget,
  buttonInlineEditField,
  getOptionToneClassName,
  getSelectedToneClassName,
  icon,
  menuClassName,
  portalMenu,
  portalMenuPlacement = "auto",
  onChange,
  options,
  showAllOption = true,
  singleSelect,
  value,
}: {
  allLabel: string;
  ariaLabel?: string;
  className?: string;
  buttonDataTutorialTarget?: string;
  buttonInlineEditField?: string;
  getOptionToneClassName?: (option: DropdownOption) => string | undefined;
  getSelectedToneClassName?: (value: FilterSelection) => string | undefined;
  icon: ReactNode;
  menuClassName?: string;
  portalMenu?: boolean;
  portalMenuPlacement?: "auto" | "above" | "below";
  onChange: (value: FilterSelection) => void;
  options: DropdownOption[];
  showAllOption?: boolean;
  singleSelect?: boolean;
  value: FilterSelection;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuOffsetX, setMenuOffsetX] = useState(0);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null);
  const filterRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const isActive = value.length > 0;
  const selectedLabel = formatFilterSelectionLabel(allLabel, options, value);
  const selectedOption = options.find((option) => option.id === value[0]);
  const selectedIcon = selectedOption?.icon ?? icon;
  const selectedToneClassName = getSelectedToneClassName?.(value);
  usePrunedFilterSelection(value, options, onChange);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      const clickedInsideFilter = target instanceof Node && filterRef.current?.contains(target);
      const clickedInsideMenu = target instanceof Node && menuRef.current?.contains(target);
      if (!clickedInsideFilter && !clickedInsideMenu) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") {
      return;
    }

    const updateMenuOffset = () => {
      const buttonElement = buttonRef.current;
      const filterElement = filterRef.current;
      const menuElement = menuRef.current;
      if (!buttonElement || !filterElement || !menuElement) {
        return;
      }

      const menuWidth = menuElement.getBoundingClientRect().width;
      const buttonRect = buttonElement.getBoundingClientRect();
      const viewElement = filterElement.closest<HTMLElement>(".workspace-panel, .panel, .page-shell, .modal-card");
      const viewRect = viewElement?.getBoundingClientRect();
      const safeMargin = 12;
      const viewLeft = Math.max(viewRect?.left ?? 0, 0) + safeMargin;
      const viewRight = Math.min(viewRect?.right ?? window.innerWidth, window.innerWidth) - safeMargin;

      if (menuWidth <= 0 || viewRight <= viewLeft) {
        setMenuOffsetX(0);
        return;
      }

      const originalLeft = buttonRect.right - menuWidth;
      const boundedLeft = Math.max(viewLeft, Math.min(originalLeft, viewRight - menuWidth));
      setMenuOffsetX(boundedLeft - originalLeft);
    };

    let alignmentRaf: number | undefined;
    const onLayoutChange = () => {
      if (alignmentRaf !== undefined) {
        window.cancelAnimationFrame(alignmentRaf);
      }
      alignmentRaf = window.requestAnimationFrame(updateMenuOffset);
    };

    onLayoutChange();
    window.addEventListener("resize", onLayoutChange);
    window.addEventListener("scroll", onLayoutChange, true);

    return () => {
      if (alignmentRaf !== undefined) {
        window.cancelAnimationFrame(alignmentRaf);
      }
      window.removeEventListener("resize", onLayoutChange);
      window.removeEventListener("scroll", onLayoutChange, true);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !portalMenu || typeof window === "undefined") {
      setMenuPosition(null);
      return;
    }

    const updateMenuPosition = () => {
      const buttonElement = buttonRef.current;
      const menuElement = menuRef.current;
      if (!buttonElement || !menuElement) {
        return;
      }

      const menuWidth = menuElement.getBoundingClientRect().width;
      const menuHeight = menuElement.getBoundingClientRect().height;
      const buttonRect = buttonElement.getBoundingClientRect();
      setMenuPosition(
        getPortalMenuPosition({
          buttonRect,
          menuHeight,
          menuWidth,
          placement: portalMenuPlacement,
          viewportHeight: window.innerHeight,
          viewportWidth: window.innerWidth,
        }),
      );
    };

    let positionRaf: number | undefined;
    const onLayoutChange = () => {
      if (positionRaf !== undefined) {
        window.cancelAnimationFrame(positionRaf);
      }
      positionRaf = window.requestAnimationFrame(updateMenuPosition);
    };

    onLayoutChange();
    window.addEventListener("resize", onLayoutChange);
    window.addEventListener("scroll", onLayoutChange, true);

    return () => {
      if (positionRaf !== undefined) {
        window.cancelAnimationFrame(positionRaf);
      }
      window.removeEventListener("resize", onLayoutChange);
      window.removeEventListener("scroll", onLayoutChange, true);
    };
  }, [isOpen, portalMenu, portalMenuPlacement]);

  return (
    <span
      className={`toolbar-filter toolbar-filter-dropdown${isActive ? " is-active" : ""}${isOpen ? " is-open" : ""}${selectedToneClassName ? ` ${selectedToneClassName}` : ""}${className ? ` ${className}` : ""}`}
      ref={filterRef}
    >
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`${ariaLabel ?? allLabel}: ${selectedLabel}`}
        className="toolbar-filter-menu-button"
        data-tutorial-target={buttonDataTutorialTarget}
        data-inline-edit-field={buttonInlineEditField}
        ref={buttonRef}
        onClick={() => setIsOpen((current) => !current)}
        title={`${ariaLabel ?? allLabel}: ${selectedLabel}`}
        type="button"
      >
        <span className="toolbar-filter-icon">{selectedIcon}</span>
        <span aria-hidden="true" className="toolbar-filter-value">
          {selectedLabel}
        </span>
        <span aria-hidden="true" className="toolbar-filter-chevron" />
      </button>
      {isOpen ? (
        portalMenu && typeof document !== "undefined" ? (
          createPortal(
            <FilterOptionMenu
              allLabel={allLabel}
              className={menuClassName ?? className}
              getOptionToneClassName={getOptionToneClassName}
              menuId={menuId}
              menuRef={menuRef}
              menuOffsetX={menuOffsetX}
              onChange={onChange}
              options={options}
              showAllOption={showAllOption}
              singleSelect={singleSelect}
              style={{
                position: "fixed",
                top: `${menuPosition?.top ?? 0}px`,
                left: `${menuPosition?.left ?? 0}px`,
                right: "auto",
                bottom: "auto",
                transform: "none",
                visibility: menuPosition ? "visible" : "hidden",
                zIndex: 50000,
              }}
              value={value}
            />,
            document.body,
          )
        ) : (
          <FilterOptionMenu
            allLabel={allLabel}
            className={menuClassName ?? className}
            getOptionToneClassName={getOptionToneClassName}
            menuId={menuId}
            menuRef={menuRef}
            menuOffsetX={menuOffsetX}
            onChange={onChange}
            options={options}
            showAllOption={showAllOption}
            singleSelect={singleSelect}
            value={value}
          />
        )
      ) : null}
    </span>
  );
}

export function ColumnFilterDropdown({
  allLabel,
  ariaLabel,
  onChange,
  options,
  value,
}: {
  allLabel: string;
  ariaLabel: string;
  onChange: (value: FilterSelection) => void;
  options: DropdownOption[];
  value: FilterSelection;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuOffsetX, setMenuOffsetX] = useState(0);
  const filterRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const isActive = value.length > 0;
  const selectedLabel = formatFilterSelectionLabel(allLabel, options, value);
  usePrunedFilterSelection(value, options, onChange);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Node && !filterRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") {
      return;
    }

    const updateMenuOffset = () => {
      const buttonElement = buttonRef.current;
      const filterElement = filterRef.current;
      const menuElement = menuRef.current;
      if (!buttonElement || !filterElement || !menuElement) {
        return;
      }

      const menuWidth = menuElement.getBoundingClientRect().width;
      const buttonRect = buttonElement.getBoundingClientRect();
      const viewElement = filterElement.closest<HTMLElement>(".workspace-panel, .panel, .page-shell");
      const viewRect = viewElement?.getBoundingClientRect();
      const safeMargin = 12;
      const viewLeft = Math.max(viewRect?.left ?? 0, 0) + safeMargin;
      const viewRight = Math.min(viewRect?.right ?? window.innerWidth, window.innerWidth) - safeMargin;

      if (menuWidth <= 0 || viewRight <= viewLeft) {
        setMenuOffsetX(0);
        return;
      }

      const originalLeft = buttonRect.right - menuWidth;
      const boundedLeft = Math.max(viewLeft, Math.min(originalLeft, viewRight - menuWidth));
      setMenuOffsetX(boundedLeft - originalLeft);
    };

    let alignmentRaf: number | undefined;
    const onLayoutChange = () => {
      if (alignmentRaf !== undefined) {
        window.cancelAnimationFrame(alignmentRaf);
      }
      alignmentRaf = window.requestAnimationFrame(updateMenuOffset);
    };

    onLayoutChange();
    window.addEventListener("resize", onLayoutChange);
    window.addEventListener("scroll", onLayoutChange, true);

    return () => {
      if (alignmentRaf !== undefined) {
        window.cancelAnimationFrame(alignmentRaf);
      }
      window.removeEventListener("resize", onLayoutChange);
      window.removeEventListener("scroll", onLayoutChange, true);
    };
  }, [isOpen]);

  return (
    <span
      className={`table-column-filter${isActive ? " is-active" : ""}${isOpen ? " is-open" : ""}`}
      ref={filterRef}
    >
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`${ariaLabel}${isActive ? `: ${selectedLabel}` : ""}`}
        className="table-column-filter-button"
        ref={buttonRef}
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((current) => !current);
        }}
        title={`${ariaLabel}${isActive ? `: ${selectedLabel}` : ""}`}
        type="button"
      >
        <IconFilter />
      </button>
      {isOpen ? (
        <FilterOptionMenu
          allLabel={allLabel}
          menuId={menuId}
          menuRef={menuRef}
          menuOffsetX={menuOffsetX}
          onChange={onChange}
          options={options}
          value={value}
        />
      ) : null}
    </span>
  );
}

export function SearchToolbarInput({
  ariaLabel,
  onChange,
  placeholder,
  value,
}: {
  ariaLabel?: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  const isActive = value.trim() !== "";

  return (
    <div className={`toolbar-filter toolbar-filter-compact toolbar-search${isActive ? " is-active" : ""}`}>
      <span className="toolbar-filter-icon">
        <IconTasks />
      </span>
      <input
        aria-label={ariaLabel ?? placeholder}
        className="toolbar-search-input"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
    </div>
  );
}
