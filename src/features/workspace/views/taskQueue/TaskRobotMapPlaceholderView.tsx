import type { BootstrapPayload } from "@/types/bootstrap";
import { RobotMapView } from "@/features/workspace/views/robotMap/RobotMapView";

interface TaskRobotMapPlaceholderViewProps {
  bootstrap: BootstrapPayload;
  openCreateMechanismModal: (subsystemId?: string) => void;
  openCreatePartInstanceModal: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  openCreateSubsystemModal: () => void;
  openEditMechanismModal: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  openEditSubsystemModal: (subsystem: BootstrapPayload["subsystems"][number]) => void;
}

export function TaskRobotMapPlaceholderView(props: TaskRobotMapPlaceholderViewProps) {
  return <RobotMapView {...props} />;
}
