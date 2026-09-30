import { IconSort } from "@/components/shared/Icons";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { SortDirectionToggle } from "@/features/workspace/shared/filters/SortDirectionToggle";

import { MANUFACTURING_SORT_OPTIONS, type ManufacturingSortField } from "./manufacturingSort";

export function ManufacturingSortMenu({
  onChange,
  onSortOrderChange,
  sortOrder,
  sortField,
}: {
  onChange: (field: ManufacturingSortField) => void;
  onSortOrderChange: (order: "asc" | "desc") => void;
  sortOrder: "asc" | "desc";
  sortField: ManufacturingSortField;
}) {
  return (
    <CompactFilterMenu
      activeCount={Number(sortField !== "dueDate") + Number(sortOrder !== "asc")}
      ariaLabel="Sort manufacturing"
      buttonLabel="Sort"
      className="task-queue-sort-menu"
      icon={<IconSort />}
      items={[
        {
          label: "Sort by",
          labelControl: (
            <SortDirectionToggle direction={sortOrder} label="manufacturing" onChange={onSortOrderChange} />
          ),
          content: (
            <select
              aria-label="Sort manufacturing by"
              className="task-queue-sort-menu-select"
              onChange={(event) => onChange(event.currentTarget.value as ManufacturingSortField)}
              value={sortField}
            >
              {MANUFACTURING_SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          ),
        },
      ]}
    />
  );
}
