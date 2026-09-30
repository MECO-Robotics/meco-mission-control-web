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
