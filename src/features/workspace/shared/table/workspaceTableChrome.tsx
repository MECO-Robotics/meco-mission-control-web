import { useEffect, useMemo, useState, type ReactNode } from "react";

import { IconEdit } from "@/components/shared/Icons";
import type { ManufacturingItemRecord, PurchaseItemRecord } from "@/types/recordsInventory";

import type { MembersById, SubsystemsById } from "../model/workspaceTypes";

const PAGE_SIZE_OPTIONS = [15, 30, 60] as const;
type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];
const DEFAULT_PAGE_SIZE: PageSizeOption = PAGE_SIZE_OPTIONS[0];

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
          onChange={(milestone) => onPageSizeChange(Number(milestone.target.value))}
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
