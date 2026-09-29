import type { ManufacturingItemRecord } from "@/types/recordsInventory";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";

export const MANUFACTURING_SORT_OPTIONS = [
  { id: "dueDate", name: "Due date" },
  { id: "title", name: "Title" },
  { id: "requester", name: "Requester" },
  { id: "subsystem", name: "Subsystem" },
  { id: "material", name: "Material" },
] as const;

export type ManufacturingSortField = (typeof MANUFACTURING_SORT_OPTIONS)[number]["id"];

export function sortManufacturingItems(
  items: ManufacturingItemRecord[],
  field: ManufacturingSortField,
  membersById: MembersById,
  subsystemsById: SubsystemsById,
) {
  const getValue = (item: ManufacturingItemRecord) => {
    switch (field) {
      case "requester":
        return item.requestedById ? membersById[item.requestedById]?.name ?? "" : "";
      case "subsystem":
        return item.subsystemId ? subsystemsById[item.subsystemId]?.name ?? "" : "";
      case "material":
        return item.material;
      case "title":
        return item.title;
      case "dueDate":
        return item.dueDate;
    }
  };

  return [...items].sort((left, right) =>
    getValue(left).localeCompare(getValue(right), undefined, { numeric: true }) ||
    left.title.localeCompare(right.title),
  );
}
