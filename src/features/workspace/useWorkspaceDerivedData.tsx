import { useMemo } from "react";

import { IconHelp, IconManufacturing, IconParts, IconReports, IconRisk, IconRoster, IconSubsystems, IconTasks, IconWorkLogs } from "@/components/shared/Icons";
import type { NavigationItem } from "@/lib/workspaceNavigation";
import type { BootstrapPayload } from "@/types/bootstrap";

interface UseWorkspaceDerivedDataArgs {
  activeTaskId: string | null;
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  selectedProjectType: BootstrapPayload["projects"][number]["projectType"] | null;
}

function recordById<T extends { id: string }>(items: T[]) {
  return Object.fromEntries(items.map((item) => [item.id, item])) as Record<string, T>;
}

export function useWorkspaceDerivedData({
  activeTaskId,
  bootstrap,
  isAllProjectsView,
  selectedProjectType,
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

  const externalMembers = useMemo(
    () => bootstrap.members.filter((member) => member.role === "external"),
    [bootstrap.members],
  );

  const membersById = useMemo(() => recordById(bootstrap.members), [bootstrap.members]);
  const subsystemsById = useMemo(() => recordById(bootstrap.subsystems), [bootstrap.subsystems]);
  const disciplinesById = useMemo(() => recordById(bootstrap.disciplines), [bootstrap.disciplines]);
  const mechanismsById = useMemo(() => recordById(bootstrap.mechanisms), [bootstrap.mechanisms]);
  const partDefinitionsById = useMemo(
    () => recordById(bootstrap.partDefinitions),
    [bootstrap.partDefinitions],
  );
  const partInstancesById = useMemo(
    () => recordById(bootstrap.partInstances),
    [bootstrap.partInstances],
  );
  const milestonesById = useMemo(() => recordById(bootstrap.milestones), [bootstrap.milestones]);

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

  const isRobotProject = selectedProjectType === "robot";
  const inventoryCount = isRobotProject
    ? bootstrap.materials.length +
      bootstrap.partDefinitions.length +
      bootstrap.partInstances.length +
      bootstrap.purchaseItems.length
    : bootstrap.artifacts.length + bootstrap.purchaseItems.length;
  const showManufacturingTab = !isAllProjectsView && isRobotProject;
  const showProjectInventoryTab = !isAllProjectsView;
  const showProjectWorkflowTab = !isAllProjectsView;
  const workflowLabel = isRobotProject ? "Subsystems" : "Workflow";
  const workflowCount = isRobotProject
    ? bootstrap.subsystems.length
    : bootstrap.workstreams.length;

  const navigationItems = useMemo<NavigationItem[]>(
    () => {
      const items: NavigationItem[] = [
        {
          value: "tasks",
          label: "Work",
          icon: <IconTasks />,
          count: bootstrap.tasks.length,
        },
        {
          value: "risk-management",
          label: "Risks",
          icon: <IconRisk />,
          count: bootstrap.risks.length,
        },
        {
          value: "worklogs",
          label: "Work logs",
          icon: <IconWorkLogs />,
          count: bootstrap.workLogs.length,
        },
        {
          value: "reports",
          label: "Reports",
          icon: <IconReports />,
          count: bootstrap.reports.length,
        },
      ];

      if (showManufacturingTab) {
        items.push({
          value: "manufacturing",
          label: "Manufacturing",
          icon: <IconManufacturing />,
          count: bootstrap.manufacturingItems.length,
        });
      }

      if (showProjectInventoryTab) {
        items.push({
          value: "inventory",
          label: "Inventory",
          icon: <IconParts />,
          count: inventoryCount,
        });
      }

      if (showProjectInventoryTab && isRobotProject) {
        items.push({
          value: "cad",
          label: "CAD",
          icon: <IconParts />,
          count: 0,
        });
      }

      if (showProjectWorkflowTab) {
        items.push({
          value: "subsystems",
          label: workflowLabel,
          icon: <IconSubsystems />,
          count: workflowCount,
        });
      }

      items.push({
        value: "roster",
        label: "Roster",
        icon: <IconRoster />,
        count: bootstrap.members.length,
      });

      items.push({
        value: "help",
        label: "Help",
        icon: <IconHelp />,
        count: 0,
      });

      return items;
    },
    [
      bootstrap.tasks.length,
      bootstrap.risks.length,
      bootstrap.workLogs.length,
      bootstrap.reports.length,
      bootstrap.manufacturingItems,
      bootstrap.members.length,
      showManufacturingTab,
      showProjectInventoryTab,
      showProjectWorkflowTab,
      isRobotProject,
      workflowCount,
      workflowLabel,
      inventoryCount,
    ],
  );

  return {
    activeTask,
    cncItems,
    disciplinesById,
    milestonesById,
    externalMembers,
    fabricationItems,
    mechanismsById,
    mentors,
    membersById,
    navigationItems,
    partDefinitionsById,
    partInstancesById,
    printItems,
    rosterMentors,
    students,
    subsystemsById,
  };
}
