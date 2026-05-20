import type { AppWorkspaceShellContentController } from "@/app/hooks/useAppWorkspaceController";

import { WorkspaceContent } from "@/app/shell/workspaceShell";

export function AppWorkspaceShellContent({
  controller,
}: {
  controller: AppWorkspaceShellContentController;
}) {
  const c = controller;

  return (
    <WorkspaceContent
      activePersonFilter={c.activePersonFilter}
      activeTab={c.activeTab}
      tabSwitchDirection={c.tabSwitchDirection}
      allMembers={c.bootstrap.members}
      artifacts={c.scopedArtifacts}
      bootstrap={c.scopedBootstrap}
      cncItems={c.cncItems}
      dataMessage={c.dataMessage}
      taskEditNotices={c.taskEditNotices}
      fabricationItems={c.fabricationItems}
      handleCreateMember={c.handleCreateMember}
      handleReactivateMemberForSeason={c.handleReactivateMemberForSeason}
      handleDeleteMember={c.handleDeleteMember}
      handleTimelineMilestoneDelete={c.handleTimelineMilestoneDelete}
      handleTimelineMilestoneSave={c.handleTimelineMilestoneSave}
      handleUpdateMember={c.handleUpdateMember}
      requestMemberPhotoUpload={c.requestMemberPhotoUpload}
      isAddPersonOpen={c.isAddPersonOpen}
      isDeletingMember={c.isDeletingMember}
      isEditPersonOpen={c.isEditPersonOpen}
      isLoadingData={c.isLoadingData}
      isAllProjectsView={c.isAllProjectsView}
      isNonRobotProject={c.isNonRobotProject}
      isSavingMember={c.isSavingMember}
      memberEditDraft={c.memberEditDraft}
      memberForm={c.memberForm}
      membersById={c.membersById}
      openCreateManufacturingModal={c.openCreateManufacturingModal}
      openCreateArtifactModal={c.openCreateArtifactModal}
      openCreateMaterialModal={c.openCreateMaterialModal}
      openCreateMechanismModal={c.openCreateMechanismModal}
      openCreatePartInstanceModal={c.openCreatePartInstanceModal}
      openCreateSubsystemModal={c.openCreateSubsystemModal}
      openCreatePartDefinitionModal={c.openCreatePartDefinitionModal}
      openCreatePurchaseModal={c.openCreatePurchaseModal}
      openCreateTaskModal={c.openCreateTaskModal}
      openCreateTaskModalFromTimeline={c.openCreateTaskModalFromTimeline}
      openCreateWorkLogModal={c.openCreateWorkLogModal}
      openCreateQaReportModal={c.openCreateQaReportModal}
      openCreateMilestoneReportModal={c.openCreateMilestoneReportModal}
      openCreateWorkstreamModal={c.openCreateWorkstreamModal}
      openEditWorkstreamModal={c.openEditWorkstreamModal}
      onCreateRisk={c.handleCreateRisk}
      onDeleteRisk={c.handleDeleteRisk}
      handleDeleteMechanism={c.handleDeleteMechanism}
      onCncQuickStatusChange={c.handleCncQuickStatusChange}
      openEditManufacturingModal={c.openEditManufacturingModal}
      openEditArtifactModal={c.openEditArtifactModal}
      openEditMaterialModal={c.openEditMaterialModal}
      openEditMechanismModal={c.openEditMechanismModal}
      openEditPartInstanceModal={c.openEditPartInstanceModal}
      openEditSubsystemModal={c.openEditSubsystemModal}
      removePartInstanceFromMechanism={c.removePartInstanceFromMechanism}
      saveSubsystemLayout={c.saveSubsystemLayout}
      updateSubsystemConfiguration={c.updateSubsystemConfiguration}
      openEditPartDefinitionModal={c.openEditPartDefinitionModal}
      openEditPurchaseModal={c.openEditPurchaseModal}
      openTimelineTaskDetailsModal={c.openTimelineTaskDetailsModal}
      onUpdateRisk={c.handleUpdateRisk}
      printItems={c.printItems}
      rosterMentors={c.rosterMentors}
      showCncMentorQuickActions={
        c.signedInMember?.role === "mentor" ||
        c.signedInMember?.role === "admin" ||
        Boolean(c.signedInMember?.elevated)
      }
      manufacturingView={c.manufacturingView}
      inventoryView={c.inventoryView}
      rosterView={c.rosterView}
      riskManagementView={c.riskManagementView}
      reportsView={c.reportsView}
      taskView={c.taskView}
      worklogsView={c.worklogsView}
      selectMember={c.selectMember}
      selectedSeasonId={c.selectedSeasonId}
      selectedProject={c.selectedProject}
      selectedMemberId={c.selectedMemberId}
      setIsAddPersonOpen={c.setIsAddPersonOpen}
      setIsEditPersonOpen={c.setIsEditPersonOpen}
      setMemberEditDraft={c.setMemberEditDraft}
      setMemberForm={c.setMemberForm}
      setActivePersonFilter={c.setActivePersonFilter}
      students={c.students}
      disciplinesById={c.disciplinesById}
      externalMembers={c.externalMembers}
      mechanismsById={c.mechanismsById}
      partDefinitionsById={c.partDefinitionsById}
      subsystemsById={c.subsystemsById}
      timelineMilestoneCreateSignal={c.timelineMilestoneCreateSignal}
      disablePanelAnimations={c.isWorkspaceModalOpen}
      onDismissDataMessage={c.clearDataMessage}
      onDismissTaskEditNotice={c.dismissTaskEditNotice}
      onTaskEditCanceled={c.notifyTaskEditCanceled}
      onTaskEditSaved={c.notifyTaskEditSaved}
      onStartInteractiveTutorial={() => void c.startInteractiveTutorial("planning")}
      onStartInteractiveTutorialChapter={(chapterId) => void c.startInteractiveTutorial(chapterId)}
      interactiveTutorialChapters={c.interactiveTutorialChapters}
      isInteractiveTutorialActive={c.isInteractiveTutorialActive}
    />
  );
}
