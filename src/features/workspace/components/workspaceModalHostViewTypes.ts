import type { TaskEditorModal } from "../modals/TaskEditorModalContent";
import type { ManufacturingEditorModal } from "../modals/purchaseManufacturing/ManufacturingEditorModal";
import type { PurchaseEditorModal } from "../modals/purchaseManufacturing/PurchaseEditorModal";
import type { MechanismEditorModal } from "../modals/structure/MechanismEditorModal";
import type { SubsystemEditorModal } from "../modals/structure/SubsystemEditorModal";
import type { PartInstanceEditorModal } from "../modals/assetCatalog/PartInstanceEditorModal";
import type { PartDefinitionEditorModal } from "../modals/assetCatalog/PartDefinitionEditorModal";
import type { WorkstreamEditorModal } from "../modals/assetCatalog/WorkstreamEditorModal";
import type { ArtifactEditorModal } from "../modals/assetCatalog/ArtifactEditorModal";
import type { ComponentProps, Dispatch, FormEvent, SetStateAction } from "react";

import type { MilestoneReportModalMode, QaReportModalMode, WorkLogModalMode } from "@/features/workspace/shared/model/workspaceModalModes";
import type { QaReportPayload, TestResultPayload, WorkLogPayload } from "@/types/payloads";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";

import type { MaterialEditorModal } from "../modals/assetCatalog/MaterialEditorModal";

export interface WorkspaceModalHostViewProps {
  taskEditor: Pick<ComponentProps<typeof TaskEditorModal>,
    "activeTask" | "closeTaskModal" | "handleDeleteTask" | "handleResolveTaskBlocker" |
    "handleTaskSubmit" | "isDeletingTask" | "isSavingTask" | "setTaskDraft" | "taskDraft"
  > & {
    taskModalMode: "create" | "edit" | null;
    activeTimelineTaskDetail: TaskRecord | null;
    closeTimelineTaskDetailsModal: () => void;
    openEditTaskModal: (task: TaskRecord) => void;
    openTimelineTaskDetailsModal: (task: TaskRecord) => void;
    showTimelineCreateToggleInTaskModal: boolean;
    switchTaskCreateToMilestone: () => void;
  };
  manufacturingEditor: Omit<ComponentProps<typeof ManufacturingEditorModal>, "bootstrap" | "manufacturingModalMode"> & { manufacturingModalMode: "create" | "edit" | null };
  purchaseEditor: Omit<ComponentProps<typeof PurchaseEditorModal>, "bootstrap" | "purchaseModalMode"> & { purchaseModalMode: "create" | "edit" | null };
  mechanismEditor: Omit<ComponentProps<typeof MechanismEditorModal>, "bootstrap" | "requestPhotoUpload" | "mechanismModalMode"> & { mechanismModalMode: "create" | "edit" | null };
  subsystemEditor: Omit<ComponentProps<typeof SubsystemEditorModal>, "bootstrap" | "requestPhotoUpload" | "subsystemModalMode"> & { subsystemModalMode: "create" | "edit" | null };
  partInstanceEditor: Omit<ComponentProps<typeof PartInstanceEditorModal>, "bootstrap" | "requestPhotoUpload" | "partDefinitionDraftsById" | "partInstanceModalMode"> & { partInstanceModalMode: "create" | "edit" | null };
  partDefinitionEditor: Omit<ComponentProps<typeof PartDefinitionEditorModal>, "bootstrap" | "requestPhotoUpload" | "partDefinitionModalMode"> & { partDefinitionModalMode: "create" | "edit" | null };
  workstreamEditor: Omit<ComponentProps<typeof WorkstreamEditorModal>, "bootstrap" | "workstreamModalMode"> & { workstreamModalMode: "create" | "edit" | null };
  artifactEditor: Omit<ComponentProps<typeof ArtifactEditorModal>, "bootstrap" | "artifactModalMode"> & { artifactModalMode: "create" | "edit" | null };
  materialEditor: ComponentProps<typeof MaterialEditorModal>;
  bootstrap: BootstrapPayload;
  mechanismsById: Record<string, BootstrapPayload["mechanisms"][number]>;
  partDefinitionsById: Record<string, BootstrapPayload["partDefinitions"][number]>;
  partInstancesById: Record<string, BootstrapPayload["partInstances"][number]>;
  closeQaReportModal: () => void;
  closeMilestoneReportModal: () => void;
  closeWorkLogModal: () => void;
  openCreateWorkLogModal: (taskId?: string) => void;
  openCreateQaReportModal: (taskId?: string) => void;
  onTaskEditCanceled: () => void;
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  milestonesById: Record<string, BootstrapPayload["milestones"][number]>;
  handleQaReportSubmit: (milestone: FormEvent<HTMLFormElement>) => Promise<void>;
  handleMilestoneReportSubmit: (milestone: FormEvent<HTMLFormElement>) => Promise<void>;
  handleWorkLogSubmit: (milestone: FormEvent<HTMLFormElement>) => Promise<void>;
  isSavingQaReport: boolean;
  isSavingMilestoneReport: boolean;
  isSavingWorkLog: boolean;
  mentors: BootstrapPayload["members"];
  qaReportDraft: QaReportPayload;
  qaReportModalMode: QaReportModalMode;
  milestoneReportDraft: TestResultPayload;
  milestoneReportFindings: string;
  milestoneReportModalMode: MilestoneReportModalMode;
  workLogDraft: WorkLogPayload;
  workLogModalMode: WorkLogModalMode;
  setQaReportDraft: Dispatch<SetStateAction<QaReportPayload>>;
  setMilestoneReportDraft: Dispatch<SetStateAction<TestResultPayload>>;
  setMilestoneReportFindings: (value: string) => void;
  setWorkLogDraft: Dispatch<SetStateAction<WorkLogPayload>>;
  students: BootstrapPayload["members"];
}
