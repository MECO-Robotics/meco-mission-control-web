import { useMemo } from "react";

import {
  IconManufacturing,
  IconParts,
  IconWorkLogs,
  IconSubsystems,
  IconRoster,
  IconTasks,
} from "../../components/shared/Icons";
import type { NavigationItem } from "./shared/workspaceTypes";
import type { BootstrapPayload } from "../../types";

interface UseWorkspaceDerivedDataArgs {
  activeTaskId: string | null;
  bootstrap: BootstrapPayload;
}

function recordById<T extends { id: string }>(items: T[]) {
  return Object.fromEntries(items.map((item) => [item.id, item])) as Record<string, T>;
}

export function useWorkspaceDerivedData({
  activeTaskId,
  bootstrap,
}: UseWorkspaceDerivedDataArgs) {
  const students = useMemo(
    () =>
      bootstrap.members.filter(
        (member) => member.role === "student" || member.role === "lead",
      ),
    [bootstrap.members],
  );

  const mentors = useMemo(
    () => bootstrap.members.filter((member) => member.role === "mentor"),
    [bootstrap.members],
  );

  const rosterMentors = useMemo(
    () =>
      bootstrap.members.filter(
        (member) => member.role === "mentor" || member.role === "admin",
      ),
    [bootstrap.members],
  );

  const membersById = useMemo(() => recordById(bootstrap.members), [bootstrap.members]);
  const subsystemsById = useMemo(() => recordById(bootstrap.subsystems), [bootstrap.subsystems]);
  const disciplinesById = useMemo(() => recordById(bootstrap.disciplines), [bootstrap.disciplines]);
  const mechanismsById = useMemo(() => recordById(bootstrap.mechanisms), [bootstrap.mechanisms]);
  const requirementsById = useMemo(() => recordById(bootstrap.requirements), [bootstrap.requirements]);
  const partDefinitionsById = useMemo(
    () => recordById(bootstrap.partDefinitions),
    [bootstrap.partDefinitions],
  );
  const partInstancesById = useMemo(
    () => recordById(bootstrap.partInstances),
    [bootstrap.partInstances],
  );
  const eventsById = useMemo(() => recordById(bootstrap.events), [bootstrap.events]);

  const activeTask = useMemo(
    () => bootstrap.tasks.find((task) => task.id === activeTaskId) ?? null,
    [activeTaskId, bootstrap.tasks],
  );

  const cncItems = useMemo(
    () => bootstrap.manufacturingItems.filter((item) => item.process === "cnc"),
    [bootstrap.manufacturingItems],
  );

  const printItems = useMemo(
    () => bootstrap.manufacturingItems.filter((item) => item.process === "3d-print"),
    [bootstrap.manufacturingItems],
  );

  const fabricationItems = useMemo(
    () => bootstrap.manufacturingItems.filter((item) => item.process === "fabrication"),
    [bootstrap.manufacturingItems],
  );

  const inventoryCount =
    bootstrap.materials.length +
    bootstrap.partDefinitions.length +
    bootstrap.partInstances.length +
    bootstrap.purchaseItems.length;

  const navigationItems = useMemo<NavigationItem[]>(
    () => [
      {
        value: "tasks",
        label: "Tasks",
        icon: <IconTasks />,
        count: bootstrap.tasks.length,
      },
      {
        value: "worklogs",
        label: "Work logs",
        icon: <IconWorkLogs />,
        count: bootstrap.workLogs.length,
      },
      {
        value: "manufacturing",
        label: "Manufacturing",
        icon: <IconManufacturing />,
        count: bootstrap.manufacturingItems.length,
      },
      {
        value: "inventory",
        label: "Inventory",
        icon: <IconParts />,
        count: inventoryCount,
      },
      {
        value: "subsystems",
        label: "Subsystems",
        icon: <IconSubsystems />,
        count: bootstrap.subsystems.length,
      },
      {
        value: "roster",
        label: "Roster",
        icon: <IconRoster />,
        count: bootstrap.members.length,
      },
    ],
    [
      bootstrap.manufacturingItems,
      bootstrap.members.length,
      bootstrap.workLogs.length,
      bootstrap.tasks.length,
      bootstrap.subsystems.length,
      inventoryCount,
    ],
  );

  return {
    activeTask,
    cncItems,
    disciplinesById,
    eventsById,
    fabricationItems,
    mechanismsById,
    mentors,
    membersById,
    navigationItems,
    partDefinitionsById,
    partInstancesById,
    printItems,
    requirementsById,
    rosterMentors,
    students,
    subsystemsById,
  };
}
