import { Suspense } from "react";

import type { AppWorkspaceShellController } from "@/app/hooks/useAppWorkspaceController";
import { AppWorkspaceShellModalLayer } from "./AppWorkspaceShellModalLayer";
import { AddSeasonPopup, RobotProjectPopup, SidebarOverlay } from "./AppWorkspaceShellOverlays";
import { AppWorkspaceShellSidebar } from "./AppWorkspaceShellSidebar";
import { AppWorkspaceShellTopbar } from "./AppWorkspaceShellTopbar";
import { WorkspaceContent, WorkspaceShellLoading } from "./workspaceShell";

export function AppWorkspaceShellView({ controller }: { controller: AppWorkspaceShellController }) {
  const c = controller;
  const content = c.content;

  return (
    <main
      className={`page-shell ${c.frame.isDarkMode ? "dark-mode" : ""} ${c.frame.isSidebarCollapsed ? "is-sidebar-collapsed" : ""} ${c.frame.isSidebarOverlay ? "is-sidebar-overlay" : ""}`}
      style={c.frame.pageShellStyle}
    >
      <Suspense fallback={<WorkspaceShellLoading />}>
        <AppWorkspaceShellTopbar controller={c.topbar} />
        <AppWorkspaceShellSidebar controller={c.sidebar} />
        {c.overlayLayer.isAddSeasonPopupOpen ? <AddSeasonPopup controller={c.overlayLayer} /> : null}
        {c.overlayLayer.robotProjectModalMode ? <RobotProjectPopup controller={c.overlayLayer} /> : null}
        <SidebarOverlay controller={c.overlayLayer} />
        <WorkspaceContent
          activePersonFilter={content.activePersonFilter}
          activeTab={content.activeTab}
          tabSwitchDirection={content.tabSwitchDirection}
          allMembers={content.bootstrap.members}
          artifacts={content.scopedArtifacts}
          availabilityBootstrap={content.bootstrap}
          bootstrap={content.scopedBootstrap}
          cncItems={content.cncItems}
          dataMessage={content.dataMessage}
          taskEditNotices={content.taskEditNotices}
          fabricationItems={content.fabricationItems}
          handleCreateMember={content.handleCreateMember}
          handleReactivateMemberForSeason={content.handleReactivateMemberForSeason}
          handleDeleteMember={content.handleDeleteMember}
          handleMeetingSave={content.handleMeetingSave}
          handleTaskStatusChange={content.handleTaskStatusChange}
          handleTimelineMilestoneDelete={content.handleTimelineMilestoneDelete}
          handleTimelineMilestoneSave={content.handleTimelineMilestoneSave}
          handleUpdateMember={content.handleUpdateMember}
          requestMemberPhotoUpload={content.requestMemberPhotoUpload}
          isAddPersonOpen={content.isAddPersonOpen}
          isDeletingMember={content.isDeletingMember}
          isEditPersonOpen={content.isEditPersonOpen}
          isLoadingData={content.isLoadingData}
          isNotificationQueueOpen={content.isNotificationQueueOpen}
          isAllProjectsView={content.isAllProjectsView}
          isNonRobotProject={content.isNonRobotProject}
          isSavingMember={content.isSavingMember}
          memberEditDraft={content.memberEditDraft}
          memberForm={content.memberForm}
          membersById={content.membersById}
          openCreateManufacturingModal={content.openCreateManufacturingModal}
          openCreateArtifactModal={content.openCreateArtifactModal}
          openCreateMaterialModal={content.openCreateMaterialModal}
          openCreateMechanismModal={content.openCreateMechanismModal}
          openCreatePartInstanceModal={content.openCreatePartInstanceModal}
          openCreateSubsystemModal={content.openCreateSubsystemModal}
          openCreatePartDefinitionModal={content.openCreatePartDefinitionModal}
          openCreatePurchaseModal={content.openCreatePurchaseModal}
          openCreateTaskModal={content.openCreateTaskModal}
          openCreateTaskModalForMember={content.openCreateTaskModalForMember}
          openCreateTaskModalFromTimeline={content.openCreateTaskModalFromTimeline}
          openCreateWorkLogModal={content.openCreateWorkLogModal}
          openCreateQaReportModal={content.openCreateQaReportModal}
          openCreateMilestoneReportModal={content.openCreateMilestoneReportModal}
          openCreateWorkstreamModal={content.openCreateWorkstreamModal}
          openEditWorkstreamModal={content.openEditWorkstreamModal}
          onCreateRisk={content.handleCreateRisk}
          onDeleteRisk={content.handleDeleteRisk}
          handleDeleteMechanism={content.handleDeleteMechanism}
          onCncQuickStatusChange={content.handleCncQuickStatusChange}
          openEditManufacturingModal={content.openEditManufacturingModal}
          openEditArtifactModal={content.openEditArtifactModal}
          openEditMaterialModal={content.openEditMaterialModal}
          openEditMechanismModal={content.openEditMechanismModal}
          openEditPartInstanceModal={content.openEditPartInstanceModal}
          openEditSubsystemModal={content.openEditSubsystemModal}
          removePartInstanceFromMechanism={content.removePartInstanceFromMechanism}
          saveSubsystemLayout={content.saveSubsystemLayout}
          updateSubsystemConfiguration={content.updateSubsystemConfiguration}
          openEditPartDefinitionModal={content.openEditPartDefinitionModal}
          openEditPurchaseModal={content.openEditPurchaseModal}
          openTimelineTaskDetailsModal={content.openTimelineTaskDetailsModal}
          onUpdateRisk={content.handleUpdateRisk}
          printItems={content.printItems}
          rosterMentors={content.rosterMentors}
          showCncMentorQuickActions={
            content.signedInMember?.role === "mentor" ||
            content.signedInMember?.role === "admin" ||
            Boolean(content.signedInMember?.elevated)
          }
          manufacturingView={content.manufacturingView}
          inventoryView={content.inventoryView}
          rosterView={content.rosterView}
          riskManagementView={content.riskManagementView}
          reportsView={content.reportsView}
          taskView={content.taskView}
          worklogsView={content.worklogsView}
          selectMember={content.selectMember}
          selectedSeasonId={content.selectedSeasonId}
          selectedProject={content.selectedProject}
          selectedMemberId={content.selectedMemberId}
          setActiveTab={content.setActiveTab}
          setInventoryView={content.setInventoryView}
          setIsAddPersonOpen={content.setIsAddPersonOpen}
          setIsEditPersonOpen={content.setIsEditPersonOpen}
          setManufacturingView={content.setManufacturingView}
          setMemberEditDraft={content.setMemberEditDraft}
          setMemberForm={content.setMemberForm}
          setRiskManagementView={content.setRiskManagementView}
          setTaskView={content.setTaskView}
          setWorklogsView={content.setWorklogsView}
          setActivePersonFilter={content.setActivePersonFilter}
          students={content.students}
          disciplinesById={content.disciplinesById}
          externalMembers={content.externalMembers}
          mechanismsById={content.mechanismsById}
          partDefinitionsById={content.partDefinitionsById}
          subsystemsById={content.subsystemsById}
          timelineMilestoneCreateSignal={content.timelineMilestoneCreateSignal}
          disablePanelAnimations={content.isWorkspaceModalOpen}
          onDismissDataMessage={content.clearDataMessage}
          onDismissNotificationHistoryItem={content.dismissNotificationHistoryItem}
          onDismissTaskEditNotice={content.dismissTaskEditNotice}
          onTaskEditCanceled={content.notifyTaskEditCanceled}
          onTaskEditSaved={content.notifyTaskEditSaved}
          onStartInteractiveTutorial={() => void content.startInteractiveTutorial("planning")}
          onStartInteractiveTutorialChapter={(chapterId) => void content.startInteractiveTutorial(chapterId)}
          interactiveTutorialChapters={content.interactiveTutorialChapters}
          isInteractiveTutorialActive={content.isInteractiveTutorialActive}
          notificationHistory={content.notificationHistory}
        />
      </Suspense>

      <AppWorkspaceShellModalLayer controller={c.modalLayer} />
    </main>
  );
}
