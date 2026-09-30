import type { ReactNode } from "react";

export type ResourceSortDirection = "ascending" | "descending";

export function ResourceColumnHeader({
  children,
  field,
  label,
  onSort,
  sortDirection,
  sortField,
}: {
  children?: ReactNode;
  field: string;
  label: string;
  onSort: (field: string) => void;
  sortDirection: ResourceSortDirection;
  sortField: string | null;
}) {
  const isSorted = sortField === field;
  const direction = isSorted ? sortDirection : "ascending";
  return (
    <span aria-sort={isSorted ? sortDirection : "none"} className="table-column-header-cell" role="columnheader">
      <button aria-label={`Sort by ${label} ${direction}`} className="table-sort-button" onClick={() => onSort(field)} type="button">
        {isSorted ? <span aria-hidden="true" className="table-sort-arrow">{sortDirection === "ascending" ? "↑" : "↓"}</span> : null}
        <span className="table-column-title">{label}</span>
      </button>
      {children}
    </span>
  );
}
