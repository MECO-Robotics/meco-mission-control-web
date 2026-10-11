import { WorkspaceSortMenu } from "@/features/workspace/shared/filters/WorkspaceSortMenu";
import type { ResourceSortDirection } from "./ResourceColumnHeader";

export function ResourceSortMenu({
  direction,
  field,
  label,
  onDirectionChange,
  onFieldChange,
  options,
}: {
  direction: ResourceSortDirection;
  field: string;
  label: string;
  onDirectionChange: (direction: ResourceSortDirection) => void;
  onFieldChange: (field: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <WorkspaceSortMenu
      ariaLabel={`Sort ${label}`}
      activeCount={1}
      direction={direction}
      field={field}
      label={label}
      onDirectionChange={onDirectionChange}
      onFieldChange={onFieldChange}
      options={options}
    />
  );
}
