import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";

export function getResourceFilterOptions(values: Iterable<string>): DropdownOption[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" })).map((value) => ({ id: value, name: value }));
}
