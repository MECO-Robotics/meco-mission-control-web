import { createPortal } from "react-dom";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { IconEdit, IconFilter, IconTasks } from "@/components/shared";
import type {
  ManufacturingItemRecord,
  PurchaseItemRecord,
  TaskRecord,
} from "@/types";
import type {
  DropdownOption,
  MembersById,
  SubsystemsById,
} from "./workspaceTypes";

const PAGE_SIZE_OPTIONS = [15, 30, 60] as const;
type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];
const DEFAULT_PAGE_SIZE: PageSizeOption = PAGE_SIZE_OPTIONS[0];
const FILTER_CHANGE_ANIMATION_DURATION_MS = 220;
export const WORKSPACE_COMPACT_BREAKPOINT = 900;
export type FilterSelection = string[];
type FilterMotionPart = boolean | number | string | null | undefined | readonly string[];
type PortalMenuPlacement = "auto" | "above" | "below";

export function getPortalMenuPosition({
  buttonRect,
  menuHeight,
  menuWidth,
  placement,
  viewportHeight,
  viewportWidth,
}: {
  buttonRect: Pick<DOMRect, "bottom" | "right" | "top">;
  menuHeight: number;
  menuWidth: number;
  placement: PortalMenuPlacement;
  viewportHeight: number;
  viewportWidth: number;
}) {
  const safeMargin = 12;
  const menuOffset = 6;
  const belowTop = buttonRect.bottom + menuOffset;
  const aboveTop = buttonRect.top - menuHeight - menuOffset;
  const spaceBelow = viewportHeight - buttonRect.bottom - menuOffset - safeMargin;
  const spaceAbove = buttonRect.top - menuOffset - safeMargin;
  const resolvedPlacement =
    placement === "auto"
      ? spaceBelow >= menuHeight || spaceBelow >= spaceAbove
        ? "below"
        : "above"
      : placement;

  return {
    left: Math.max(
      safeMargin,
      Math.min(buttonRect.right - menuWidth, viewportWidth - menuWidth - safeMargin),
    ),
    top:
      resolvedPlacement === "below"
        ? Math.min(viewportHeight - menuHeight - safeMargin, belowTop)
        : Math.max(safeMargin, aboveTop),
  };
}

function normalizePageSize(value: number): PageSizeOption {
  return PAGE_SIZE_OPTIONS.includes(value as PageSizeOption)
    ? (value as PageSizeOption)
    : DEFAULT_PAGE_SIZE;
}

export function useWorkspacePagination<T>(
  items: T[],
  defaultPageSize: PageSizeOption = DEFAULT_PAGE_SIZE,
) {
  const [pageSize, setPageSizeState] = useState<PageSizeOption>(defaultPageSize);
  const [page, setPage] = useState(1);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [items, page, pageSize]);

  const setPageSize = (nextPageSize: number) => {
    const normalizedPageSize = normalizePageSize(nextPageSize);

    setPage((currentPage) => {
      const firstItemIndex = (currentPage - 1) * pageSize;
      return Math.floor(firstItemIndex / normalizedPageSize) + 1;
    });
    setPageSizeState(normalizedPageSize);
  };

  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = totalItems === 0 ? 0 : Math.min(totalItems, page * pageSize);

  return {
    page,
    pageItems,
    pageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    rangeEnd,
    rangeStart,
    setPage,
    setPageSize,
    totalItems,
    totalPages,
  };
}

export function TableCell({
  label,
  valueClassName,
  children,
}: {
  label: string;
  valueClassName?: string;
  children: ReactNode;
}) {
  return (
    <span className="table-cell" data-label={label}>
      <span className={`table-cell-value${valueClassName ? ` ${valueClassName}` : ""}`}>
        {children}
      </span>
    </span>
  );
}

export function filterSelectionIncludes(selection: FilterSelection, value: string | null | undefined) {
  return selection.length === 0 || (typeof value === "string" && selection.includes(value));
}

export function filterSelectionIntersects(selection: FilterSelection, values: string[]) {
  return selection.length === 0 || values.some((value) => selection.includes(value));
}

export function pruneFilterSelection(selection: FilterSelection, options: DropdownOption[]) {
  if (selection.length === 0) {
    return selection;
  }

  const optionIds = new Set(options.map((option) => option.id));
  return selection.filter((selectedValue) => optionIds.has(selectedValue));
}

function areFilterSelectionsEqual(left: FilterSelection, right: FilterSelection) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function usePrunedFilterSelection(
  value: FilterSelection,
  options: DropdownOption[],
  onChange: (value: FilterSelection) => void,
) {
  useEffect(() => {
    const prunedValue = pruneFilterSelection(value, options);
    if (!areFilterSelectionsEqual(value, prunedValue)) {
      onChange(prunedValue);
    }
  }, [onChange, options, value]);
}

export function getTaskPersonFilterIds(task: TaskRecord) {
  const assigneeIds = Array.isArray(task.assigneeIds) ? task.assigneeIds : [];
  const candidateIds = [
    ...assigneeIds,
    task.ownerId,
    task.mentorId,
  ].filter((value): value is string => typeof value === "string" && value.length > 0);

  return Array.from(new Set(candidateIds));
}

export function filterSelectionMatchesTaskPeople(selection: FilterSelection, task: TaskRecord) {
  return filterSelectionIntersects(selection, getTaskPersonFilterIds(task));
}

function serializeFilterMotionPart(part: FilterMotionPart) {
  if (Array.isArray(part)) {
    return `[${part.join(",")}]`;
  }

  return `${part ?? ""}`;
}

export function useFilterChangeMotionClass(parts: readonly FilterMotionPart[]) {
  const signature = parts.map(serializeFilterMotionPart).join("||");
  const previousSignatureRef = useRef(signature);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (previousSignatureRef.current === signature) {
      return;
    }

    previousSignatureRef.current = signature;
    setIsAnimating(false);

    if (typeof window === "undefined") {
      return;
    }

    let timeoutId: number | undefined;
    const startAnimation = () => {
      setIsAnimating(true);
      timeoutId = window.setTimeout(
        () => setIsAnimating(false),
        FILTER_CHANGE_ANIMATION_DURATION_MS,
      );
    };
    const hasAnimationFrame = typeof window.requestAnimationFrame === "function";
    const startId = hasAnimationFrame
      ? window.requestAnimationFrame(startAnimation)
      : window.setTimeout(startAnimation, 0);

    return () => {
      if (hasAnimationFrame) {
        window.cancelAnimationFrame(startId);
      } else {
        window.clearTimeout(startId);
      }

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [signature]);

  return `filter-results-motion${isAnimating ? " is-filtering" : ""}`;
}

export function useWorkspaceCompactMode(breakpoint = WORKSPACE_COMPACT_BREAKPOINT) {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateCompactState = () => {
      setIsCompact(window.innerWidth <= breakpoint);
    };

    updateCompactState();
    window.addEventListener("resize", updateCompactState);

    return () => {
      window.removeEventListener("resize", updateCompactState);
    };
  }, [breakpoint]);

  return isCompact;
}

function toggleFilterSelection(selection: FilterSelection, value: string) {
  return selection.includes(value)
    ? selection.filter((selectedValue) => selectedValue !== value)
    : [...selection, value];
}

export function formatFilterSelectionLabel(
  allLabel: string,
  options: DropdownOption[],
  value: FilterSelection,
) {
  if (value.length === 0) {
    return allLabel;
  }

  if (value.length === 1) {
    return options.find((option) => option.id === value[0])?.name ?? "1 selected";
  }

  return `${value.length} selected`;
}

function FilterOptionMenu({
  allLabel,
  className,
  menuId,
  menuRef,
  menuOffsetX,
  style,
  getOptionToneClassName,
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
  style?: CSSProperties;
  onChange: (value: FilterSelection) => void;
  options: DropdownOption[];
  value: FilterSelection;
}) {
  return (
    <div
      aria-multiselectable={singleSelect ? undefined : "true"}
      className={`table-column-filter-menu${className ? ` ${className}` : ""}`}
      style={style ?? { transform: `translateX(${menuOffsetX}px)` }}
      ref={menuRef}
      id={menuId}
      role="listbox"
    >
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
      {options.map((option) => {
        const isSelected = value.includes(option.id);

        return (
          <button
            aria-selected={isSelected}
            className={`table-column-filter-option${isSelected ? " is-selected" : ""}${getOptionToneClassName?.(option) ? ` ${getOptionToneClassName(option)}` : ""}`}
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
  portalMenuPlacement?: PortalMenuPlacement;
  onChange: (value: FilterSelection) => void;
  options: DropdownOption[];
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
        <span className="toolbar-filter-icon">{icon}</span>
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
            singleSelect={singleSelect}
            value={value}
          />
        )
      ) : null}
    </span>
  );
}

export type CompactFilterMenuItem = {
  content: ReactNode;
  hidden?: boolean;
  label: string;
};

export function CompactFilterMenu({
  activeCount = 0,
  ariaLabel = "Filters",
  buttonLabel = "Filters",
  className,
  icon,
  items,
}: {
  activeCount?: number;
  ariaLabel?: string;
  buttonLabel?: string;
  className?: string;
  icon?: ReactNode;
  items: CompactFilterMenuItem[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLSpanElement>(null);
  const menuId = useId();
  const visibleItems = items.filter((item) => !item.hidden);
  const isActive = activeCount > 0;

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Node && !menuRef.current?.contains(target)) {
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

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <span
      className={`toolbar-filter toolbar-filter-dropdown task-queue-filter-menu${isActive ? " is-active" : ""}${isOpen ? " is-open" : ""}${className ? ` ${className}` : ""}`}
      ref={menuRef}
    >
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        className="toolbar-filter-menu-button task-queue-filter-menu-button"
        onClick={() => setIsOpen((current) => !current)}
        title={buttonLabel}
        type="button"
      >
        <span className="toolbar-filter-icon">
          {icon ?? <IconFilter />}
        </span>
        <span aria-hidden="true" className="toolbar-filter-value">
          {buttonLabel}
        </span>
        {activeCount > 0 ? (
          <span aria-hidden="true" className="task-queue-filter-count">
            {activeCount}
          </span>
        ) : null}
        <span aria-hidden="true" className="toolbar-filter-chevron" />
      </button>

      {isOpen ? (
        <div aria-label={ariaLabel} className="task-queue-filter-menu-popover" id={menuId} role="menu">
          {visibleItems.map((item) => (
            <div className="task-queue-filter-menu-item" key={item.label}>
              <span className="task-queue-filter-menu-label">{item.label}</span>
              {item.content}
            </div>
          ))}
        </div>
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

export function EditableHoverIndicator({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`editable-hover-indicator${className ? ` ${className}` : ""}`}
    >
      <IconEdit />
    </span>
  );
}

export function RequestedItemMeta({
  item,
  membersById,
  subsystemsById,
}: {
  item: PurchaseItemRecord | ManufacturingItemRecord;
  membersById: MembersById;
  subsystemsById: SubsystemsById;
}) {
  return (
    <div className="requested-item-meta">
      <strong className="requested-item-title">{item.title}</strong>
      <small className="requested-item-subtitle">
        {(item.subsystemId ? subsystemsById[item.subsystemId]?.name : null) ?? "Unknown subsystem"} /{" "}
        {(item.requestedById ? membersById[item.requestedById]?.name : null) ?? "Unassigned"}
      </small>
    </div>
  );
}

export function PaginationControls({
  label,
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  pageSizeOptions,
  rangeEnd,
  rangeStart,
  totalItems,
  totalPages,
}: {
  label: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  page: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  rangeEnd: number;
  rangeStart: number;
  totalItems: number;
  totalPages: number;
}) {
  if (totalItems === 0) {
    return null;
  }

  return (
    <div aria-label={`${label} pagination`} className="table-pagination" role="navigation">
      <p className="table-pagination-summary">
        Showing {rangeStart}-{rangeEnd} of {totalItems}
      </p>
      <label className="table-pagination-size">
        Rows
        <select
          aria-label={`${label} rows per page`}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          value={pageSize}
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <div className="table-pagination-controls">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          Previous
        </button>
        <span className="table-pagination-page">
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}
