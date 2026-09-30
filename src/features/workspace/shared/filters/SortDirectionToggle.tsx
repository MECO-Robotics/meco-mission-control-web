import { ArrowDown, ArrowUp } from "lucide-react";

export type SortDirection = "asc" | "desc" | "ascending" | "descending";

export function SortDirectionToggle<T extends SortDirection>({
  direction,
  label,
  onChange,
}: {
  direction: T;
  label: string;
  onChange: (direction: T) => void;
}) {
  const isAscending = direction === "asc" || direction === "ascending";
  const nextDirection = direction === "asc" || direction === "desc"
    ? (isAscending ? "desc" : "asc")
    : (isAscending ? "descending" : "ascending");

  return (
    <button
      aria-label={`Toggle ${label} sort direction`}
      aria-pressed={isAscending}
      className="task-queue-sort-direction-toggle"
      onClick={() => onChange(nextDirection as T)}
      title={`${isAscending ? "Ascending" : "Descending"}; click to switch`}
      type="button"
    >
      {isAscending ? <ArrowUp aria-hidden="true" size={15} /> : <ArrowDown aria-hidden="true" size={15} />}
    </button>
  );
}
