import { RisksView } from "@/features/workspace/views/RisksView";
import { WorkspaceSectionPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";

export function WorkspaceRisksSection(props: WorkspaceContentPanelsViewProps) {
  return (
    <WorkspaceSectionPanel disableAnimations={props.disablePanelAnimations} isActive={props.activeTab === "risks"} tabSwitchDirection={props.tabSwitchDirection}>
      <RisksView
        activePersonFilter={props.activePersonFilter}
        bootstrap={props.bootstrap}
        onCreateRisk={props.onCreateRisk}
        onDeleteRisk={props.onDeleteRisk}
        onUpdateRisk={props.onUpdateRisk}
        openTaskDetailModal={props.openTimelineTaskDetailsModal}
        selectedRiskId={new URLSearchParams(window.location.search).get("risk")}
        onOpenSchedule={(milestoneId) => props.onOpenDrilldownTarget({ tab: "tasks", taskView: "agenda", milestoneId })}
        onOpenRecord={(kind, id) => {
          if (kind === "purchase-item") {
            const record = props.bootstrap.purchaseItems.find((item) => item.id === id);
            if (record) props.openEditPurchaseModal(record);
          } else if (kind === "material") {
            const record = props.bootstrap.materials.find((item) => item.id === id);
            if (record) props.openEditMaterialModal(record);
          } else if (kind === "part-instance") {
            const record = props.bootstrap.partInstances.find((item) => item.id === id);
            if (record) props.openEditPartInstanceModal(record);
          } else if (kind === "part-definition") {
            const record = props.bootstrap.partDefinitions.find((item) => item.id === id);
            if (record) props.openEditPartDefinitionModal(record);
          } else if (kind === "subsystem") {
            const record = props.bootstrap.subsystems.find((item) => item.id === id);
            if (record) props.openEditSubsystemModal(record);
          } else if (kind === "mechanism") {
            const record = props.bootstrap.mechanisms.find((item) => item.id === id);
            if (record) props.openEditMechanismModal(record);
          } else if (kind === "artifact") {
            const record = props.bootstrap.artifacts.find((item) => item.id === id);
            if (record) props.openEditArtifactModal(record);
          } else if (kind === "task-dependency") {
            const dependency = props.bootstrap.taskDependencies.find((item) => item.id === id);
            const task = props.bootstrap.tasks.find((item) => item.id === dependency?.taskId);
            if (task) props.openTimelineTaskDetailsModal(task);
          } else if (kind === "workstream") {
            const workstream = props.bootstrap.workstreams.find((item) => item.id === id);
            if (workstream) props.openEditWorkstreamModal(workstream);
          } else {
            const report = props.bootstrap.reports.find((item) => item.id === id);
            props.onOpenDrilldownTarget({ tab: "worklogs", worklogsView: kind === "test-result" || kind === "test-finding" || (report && report.reportType !== "qa") ? "results" : "qa" });
          }
        }}
      />
    </WorkspaceSectionPanel>
  );
}
