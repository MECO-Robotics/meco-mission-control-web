import { WorkspaceSortMenu } from "@/features/workspace/shared/filters/WorkspaceSortMenu";

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
    <WorkspaceSortMenu
      activeCount={Number(sortField !== "dueDate") + Number(sortOrder !== "asc")}
      direction={sortOrder}
      field={sortField}
      label="manufacturing"
      onDirectionChange={onSortOrderChange}
      onFieldChange={(field) => onChange(field as ManufacturingSortField)}
      options={MANUFACTURING_SORT_OPTIONS.map(({ id: value, name: label }) => ({ label, value }))}
    />
  );
}
