import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";

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
export type FilterSelection = string[];

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
  menuId,
  onChange,
  options,
  value,
}: {
  allLabel: string;
  menuId: string;
  onChange: (value: FilterSelection) => void;
  options: DropdownOption[];
  value: FilterSelection;
}) {
  return (
    <div
      aria-multiselectable="true"
      className="table-column-filter-menu"
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
            className={`table-column-filter-option${isSelected ? " is-selected" : ""}`}
            key={option.id}
            onClick={(event) => {
              event.stopPropagation();
              onChange(toggleFilterSelection(value, option.id));
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
  icon,
  onChange,
  options,
  value,
}: {
  allLabel: string;
  ariaLabel?: string;
  className?: string;
  icon: ReactNode;
  onChange: (value: FilterSelection) => void;
  options: DropdownOption[];
  value: FilterSelection;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const filterRef = useRef<HTMLSpanElement>(null);
  const menuId = useId();
  const isActive = value.length > 0;
  const selectedLabel = formatFilterSelectionLabel(allLabel, options, value);

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

  return (
    <span
      className={`toolbar-filter toolbar-filter-dropdown${isActive ? " is-active" : ""}${isOpen ? " is-open" : ""}${className ? ` ${className}` : ""}`}
      ref={filterRef}
    >
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`${ariaLabel ?? allLabel}: ${selectedLabel}`}
        className="toolbar-filter-menu-button"
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
        <FilterOptionMenu
          allLabel={allLabel}
          menuId={menuId}
          onChange={onChange}
          options={options}
          value={value}
        />
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
  const filterRef = useRef<HTMLSpanElement>(null);
  const menuId = useId();
  const isActive = value.length > 0;
  const selectedLabel = formatFilterSelectionLabel(allLabel, options, value);

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



