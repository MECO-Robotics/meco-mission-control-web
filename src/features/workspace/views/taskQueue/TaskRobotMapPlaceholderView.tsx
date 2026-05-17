import type { BootstrapPayload } from "@/types/bootstrap";
import type { SubsystemLayoutFields } from "@/lib/appUtils/subsystemLayout";
import { RobotMapView } from "@/features/workspace/views/robotMap/RobotMapView";

interface TaskRobotMapPlaceholderViewProps {
  bootstrap: BootstrapPayload;
  openCreateMechanismModal: (subsystemId?: string) => void;
  openCreatePartInstanceModal: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  openCreateSubsystemModal: () => void;
  handleDeleteMechanism: (mechanismId: string) => Promise<void>;
  openEditMechanismModal: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  openEditPartInstanceModal: (partInstance: BootstrapPayload["partInstances"][number]) => void;
  openEditSubsystemModal: (subsystem: BootstrapPayload["subsystems"][number]) => void;
  removePartInstanceFromMechanism: (partInstanceId: string) => Promise<boolean>;
  saveSubsystemLayout: (
    subsystemId: string,
    layout: SubsystemLayoutFields,
  ) => Promise<boolean>;
  updateSubsystemConfiguration: (
    subsystemId: string,
    patch: Partial<
      Pick<
        BootstrapPayload["subsystems"][number],
        "name" | "description" | "layoutX" | "layoutY" | "layoutZone" | "layoutView" | "sortOrder"
      >
    >,
  ) => Promise<boolean>;
}

export function TaskRobotMapPlaceholderView(props: TaskRobotMapPlaceholderViewProps) {
  return <RobotMapView {...props} />;
}
