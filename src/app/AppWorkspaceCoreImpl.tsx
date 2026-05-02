import { Suspense } from "react";

import "@/app/App.css";
import { AuthStatusScreen, SignInScreen } from "@/features/auth";
import { AppSidebar, AppTopbar, WorkspaceContent, WorkspaceModalHost, WorkspaceShellLoading } from "@/app/workspaceShell";
import { InteractiveTutorialOverlay } from "@/app/interactiveTutorial/InteractiveTutorialOverlay";
import { useAppWorkspaceController } from "@/app/useAppWorkspaceController";

export default function AppWorkspaceCoreImpl() {
  const c = useAppWorkspaceController();

  if (c.authBooting) {
    return (
      <AuthStatusScreen
        body="Checking the server-side auth configuration before the workspace opens."
        isDarkMode={c.isDarkMode}
        shellStyle={c.isDarkMode ? c.pageShellStyle : undefined}
        title="Loading sign-in rules for MECO Robotics."
      />
    );
  }

  if (!c.authConfig) {
    return (
      <AuthStatusScreen
        body="The app could not confirm the server-side sign-in rules, so access is paused until the API is reachable again."
        isDarkMode={c.isDarkMode}
        message={c.authMessage}
        shellStyle={c.isDarkMode ? c.pageShellStyle : undefined}
        title="Couldn&apos;t load the authentication configuration."
      />
    );
  }

  if (c.enforcedAuthConfig && !c.sessionUser) {
    return (
      <SignInScreen
        authMessage={c.authMessage}
        clearAuthMessage={c.clearAuthMessage}
        hasEmailSignIn={c.isEmailAuthAvailable}
        hasGoogleSignIn={c.isGoogleAuthAvailable}
        googleButtonRef={c.googleButtonRef}
        isDarkMode={c.isDarkMode}
        isSigningIn={c.isSigningIn}
        onRequestEmailCode={c.handleRequestEmailCode}
        onVerifyEmailCode={c.handleVerifyEmailCode}
        onDevBypassSignIn={c.handleDevBypassSignIn}
        shellStyle={c.isDarkMode ? c.pageShellStyle : undefined}
        signInConfig={c.enforcedAuthConfig}
      />
    );
  }

  return (
    <main
      className={`page-shell ${c.isDarkMode ? "dark-mode" : ""} ${c.isSidebarCollapsed ? "is-sidebar-collapsed" : ""} ${c.isSidebarOverlay ? "is-sidebar-overlay" : ""}`}
      style={c.pageShellStyle}
    >
      <Suspense fallback={<WorkspaceShellLoading />}>
        <AppTopbar
          activeTab={c.activeTab}
          handleSignOut={c.handleSignOut}
          inventoryView={c.inventoryView}
          isLoadingData={c.isLoadingData}
          isMyViewActive={c.isMyViewActive}
          isNonRobotProject={c.isNonRobotProject}
          loadWorkspace={c.loadWorkspace}
          manufacturingView={c.manufacturingView}
          riskManagementView={c.riskManagementView}
          reportsView={c.reportsView}
          myViewMemberName={c.signedInMember?.name ?? null}
          sessionUser={c.sessionUser}
          setInventoryView={c.setInventoryView}
          setManufacturingView={c.setManufacturingView}
          setRiskManagementView={c.setRiskManagementView}
          setReportsView={c.setReportsView}
          setTaskView={c.setTaskView}
          setWorklogsView={c.setWorklogsView}
          taskView={c.taskView}
          worklogsView={c.worklogsView}
          seasons={c.bootstrap.seasons}
          selectedSeasonId={c.selectedSeasonId}
          subsystemsLabel={c.subsystemsLabel}
          onCreateSeason={c.handleCreateSeason}
          onSelectSeason={c.setSelectedSeasonId}
          onToggleMyView={c.toggleMyView}
          isDarkMode={c.isDarkMode}
          toggleDarkMode={c.toggleDarkMode}
          isSidebarCollapsed={c.isSidebarCollapsed}
        />

        <AppSidebar
          activeTab={c.activeTab}
          items={c.navigationItems}
          onSelectTab={c.handleSidebarTabSelect}
          isCollapsed={c.isSidebarCollapsed}
          toggleSidebar={c.toggleSidebar}
          projects={c.projectsInSelectedSeason}
          selectedProjectId={c.selectedProjectId}
          onSelectProject={c.setSelectedProjectId}
          onCreateRobot={c.handleCreateRobot}
          onEditSelectedRobot={c.handleEditSelectedRobot}
        />

        {c.isAddSeasonPopupOpen ? (
          <div
            className="modal-scrim"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                c.closeCreateSeasonPopup();
              }
            }}
            role="presentation"
          >
            <section aria-modal="true" className="modal-card roster-edit-modal" role="dialog">
              <div className="panel-header compact-header">
                <div className="queue-section-header">
                  <h3>Add season</h3>
                  <p className="section-copy">
                    Create a new season and switch the workspace to it.
                  </p>
                </div>
                <button className="icon-button" onClick={c.closeCreateSeasonPopup} type="button">
                  Close
                </button>
              </div>
              <form className="modal-form" onSubmit={c.handleCreateSeasonSubmit}>
                <label className="field modal-wide">
                  <span>Name</span>
                  <input
                    autoFocus
                    minLength={2}
                    onChange={(event) => c.setSeasonNameDraft(event.target.value)}
                    placeholder="2027 Season"
                    required
                    value={c.seasonNameDraft}
                  />
                </label>
                <div className="modal-actions modal-wide">
                  <button
                    className="secondary-action"
                    onClick={c.closeCreateSeasonPopup}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button className="primary-action" disabled={c.isSavingSeason} type="submit">
                    {c.isSavingSeason ? "Saving..." : "Add season"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        ) : null}

        {c.robotProjectModalMode ? (
          <div
            className="modal-scrim"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                c.closeRobotProjectPopup();
              }
            }}
            role="presentation"
          >
            <section aria-modal="true" className="modal-card roster-edit-modal" role="dialog">
              <div className="panel-header compact-header">
                <div className="queue-section-header">
                  <h3>
                    {c.robotProjectModalMode === "create" ? "Add robot" : "Edit robot name"}
                  </h3>
                </div>
                <button className="icon-button" onClick={c.closeRobotProjectPopup} type="button">
                  Close
                </button>
              </div>
              <form className="modal-form" onSubmit={c.handleRobotProjectSubmit}>
                <label className="field modal-wide">
                  <span>Name</span>
                  <input
                    autoFocus
                    minLength={2}
                    onChange={(event) => c.setRobotProjectNameDraft(event.target.value)}
                    placeholder="Practice Bot"
                    required
                    value={c.robotProjectNameDraft}
                  />
                </label>
                <div className="modal-actions modal-wide">
                  <button
                    className="secondary-action"
                    onClick={c.closeRobotProjectPopup}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button className="primary-action" disabled={c.isSavingRobotProject} type="submit">
                    {c.isSavingRobotProject
                      ? "Saving..."
                      : c.robotProjectModalMode === "create"
                        ? "Add robot"
                        : "Save name"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        ) : null}

        {c.isSidebarOverlay ? (
          <>
            <button
              aria-label="Close sidebar"
              className="sidebar-overlay-scrim"
              onClick={c.closeSidebarOverlay}
              type="button"
            />
            <button
              aria-hidden="true"
              className="sidebar-overlay-topbar-scrim"
              onClick={c.closeSidebarOverlay}
              tabIndex={-1}
              type="button"
            />
          </>
        ) : null}

        <WorkspaceContent
          activePersonFilter={c.activePersonFilter}
          activeTab={c.activeTab}
          tabSwitchDirection={c.tabSwitchDirection}
          allMembers={c.bootstrap.members}
          artifacts={c.scopedArtifacts}
          bootstrap={c.scopedBootstrap}
          cncItems={c.cncItems}
          dataMessage={c.dataMessage}
          taskEditNotice={c.taskEditNotice}
          fabricationItems={c.fabricationItems}
          handleCreateMember={c.handleCreateMember}
          handleReactivateMemberForSeason={c.handleReactivateMemberForSeason}
          handleDeleteMember={c.handleDeleteMember}
          handleTimelineEventDelete={c.handleTimelineEventDelete}
          handleTimelineEventSave={c.handleTimelineEventSave}
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
          openCreateEventReportModal={c.openCreateEventReportModal}
          openCreateWorkstreamModal={c.openCreateWorkstreamModal}
          openEditWorkstreamModal={c.openEditWorkstreamModal}
          onCreateRisk={c.handleCreateRisk}
          onDeleteRisk={c.handleDeleteRisk}
          onCncQuickStatusChange={c.handleCncQuickStatusChange}
          openEditManufacturingModal={c.openEditManufacturingModal}
          openEditArtifactModal={c.openEditArtifactModal}
          openEditMaterialModal={c.openEditMaterialModal}
          openEditMechanismModal={c.openEditMechanismModal}
          openEditPartInstanceModal={c.openEditPartInstanceModal}
          openEditSubsystemModal={c.openEditSubsystemModal}
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
          onDismissTaskEditNotice={c.clearTaskEditNotice}
          onStartInteractiveTutorial={() => void c.startInteractiveTutorial("planning")}
          onStartInteractiveTutorialChapter={(chapterId) =>
            void c.startInteractiveTutorial(chapterId)}
          interactiveTutorialChapters={c.interactiveTutorialChapters}
          isInteractiveTutorialActive={c.isInteractiveTutorialActive}
        />
      </Suspense>

      {c.interactiveTutorialOverlayProps ? (
        <InteractiveTutorialOverlay {...c.interactiveTutorialOverlayProps} />
      ) : null}

      {c.isWorkspaceModalOpen ? (
        <Suspense fallback={null}>
          <WorkspaceModalHost
            activeArtifactId={c.activeArtifactId}
            activePartDefinitionId={c.activePartDefinitionId}
            activeMaterialId={c.activeMaterialId}
            activeMechanismId={c.activeMechanismId}
            activeWorkstreamId={c.activeWorkstreamId}
            activeSubsystemId={c.activeSubsystemId}
            activeTask={c.activeTask}
            activeTimelineTaskDetail={c.activeTimelineTaskDetail}
            bootstrap={c.scopedBootstrap}
            closeManufacturingModal={c.closeManufacturingModal}
            closeArtifactModal={c.closeArtifactModal}
            closeMaterialModal={c.closeMaterialModal}
            closeMechanismModal={c.closeMechanismModal}
            closePartInstanceModal={c.closePartInstanceModal}
            closePartDefinitionModal={c.closePartDefinitionModal}
            closePurchaseModal={c.closePurchaseModal}
            closeQaReportModal={c.closeQaReportModal}
            closeEventReportModal={c.closeEventReportModal}
            closeTimelineTaskDetailsModal={c.closeTimelineTaskDetailsModal}
            closeWorkLogModal={c.closeWorkLogModal}
            closeSubsystemModal={c.closeSubsystemModal}
            closeTaskModal={c.closeTaskModal}
            closeWorkstreamModal={c.closeWorkstreamModal}
            onTaskEditCanceled={c.notifyTaskEditCanceled}
            requestPhotoUpload={c.requestPhotoUpload}
            disciplinesById={c.disciplinesById}
            eventsById={c.eventsById}
            handleDeleteMaterial={c.handleDeleteMaterial}
            handleDeleteArtifact={c.handleDeleteArtifact}
            handleToggleArtifactArchived={c.handleToggleArtifactArchived}
            handleDeletePartDefinition={c.handleDeletePartDefinition}
            handleDeleteMechanism={c.handleDeleteMechanism}
            handleTogglePartDefinitionArchived={c.handleTogglePartDefinitionArchived}
            handleToggleSubsystemArchived={c.handleToggleSubsystemArchived}
            handleToggleMechanismArchived={c.handleToggleMechanismArchived}
            handleToggleWorkstreamArchived={c.handleToggleWorkstreamArchived}
            handleDeleteTask={c.handleDeleteTask}
            handlePartInstanceSubmit={c.handlePartInstanceSubmit}
            handleMechanismSubmit={c.handleMechanismSubmit}
            handleManufacturingSubmit={c.handleManufacturingSubmit}
            handleMaterialSubmit={c.handleMaterialSubmit}
            handlePartDefinitionSubmit={c.handlePartDefinitionSubmit}
            handleArtifactSubmit={c.handleArtifactSubmit}
            handlePurchaseSubmit={c.handlePurchaseSubmit}
            handleQaReportSubmit={c.handleQaReportSubmit}
            handleEventReportSubmit={c.handleEventReportSubmit}
            handleWorkLogSubmit={c.handleWorkLogSubmit}
            handleSubsystemSubmit={c.handleSubsystemSubmit}
            handleTaskSubmit={c.handleTaskSubmit}
            handleResolveTaskBlocker={c.handleResolveTaskBlocker}
            handleWorkstreamSubmit={c.handleWorkstreamSubmit}
            isDeletingMaterial={c.isDeletingMaterial}
            isDeletingArtifact={c.isDeletingArtifact}
            isDeletingPartDefinition={c.isDeletingPartDefinition}
            isDeletingMechanism={c.isDeletingMechanism}
            isDeletingTask={c.isDeletingTask}
            isSavingManufacturing={c.isSavingManufacturing}
            isSavingArtifact={c.isSavingArtifact}
            isSavingMaterial={c.isSavingMaterial}
            isSavingPartDefinition={c.isSavingPartDefinition}
            isSavingPartInstance={c.isSavingPartInstance}
            isSavingMechanism={c.isSavingMechanism}
            isSavingPurchase={c.isSavingPurchase}
            isSavingQaReport={c.isSavingQaReport}
            isSavingEventReport={c.isSavingEventReport}
            isSavingWorkLog={c.isSavingWorkLog}
            isSavingSubsystem={c.isSavingSubsystem}
            isSavingTask={c.isSavingTask}
            isSavingWorkstream={c.isSavingWorkstream}
            artifactDraft={c.artifactDraft}
            artifactModalMode={c.artifactModalMode}
            manufacturingDraft={c.manufacturingDraft}
            manufacturingModalMode={c.manufacturingModalMode}
            materialDraft={c.materialDraft}
            materialModalMode={c.materialModalMode}
            mechanismsById={c.mechanismsById}
            mentors={c.mentors}
            mechanismDraft={c.mechanismDraft}
            mechanismModalMode={c.mechanismModalMode}
            partInstanceDraft={c.partInstanceDraft}
            partInstanceModalMode={c.partInstanceModalMode}
            partDefinitionDraft={c.partDefinitionDraft}
            partDefinitionModalMode={c.partDefinitionModalMode}
            partDefinitionsById={c.partDefinitionsById}
            partInstancesById={c.partInstancesById}
            purchaseDraft={c.purchaseDraft}
            purchaseFinalCost={c.purchaseFinalCost}
            purchaseModalMode={c.purchaseModalMode}
            qaReportDraft={c.qaReportDraft}
            qaReportModalMode={c.qaReportModalMode}
            eventReportDraft={c.eventReportDraft}
            eventReportFindings={c.eventReportFindings}
            eventReportModalMode={c.eventReportModalMode}
            workLogDraft={c.workLogDraft}
            workLogModalMode={c.workLogModalMode}
            workstreamDraft={c.workstreamDraft}
            workstreamModalMode={c.workstreamModalMode}
            setArtifactDraft={c.setArtifactDraft}
            setMechanismDraft={c.setMechanismDraft}
            setManufacturingDraft={c.setManufacturingDraft}
            setMaterialDraft={c.setMaterialDraft}
            setPartInstanceDraft={c.setPartInstanceDraft}
            setPartDefinitionDraft={c.setPartDefinitionDraft}
            setPurchaseDraft={c.setPurchaseDraft}
            setPurchaseFinalCost={c.setPurchaseFinalCost}
            setQaReportDraft={c.setQaReportDraft}
            setEventReportDraft={c.setEventReportDraft}
            setEventReportFindings={c.setEventReportFindings}
            setWorkLogDraft={c.setWorkLogDraft}
            setWorkstreamDraft={c.setWorkstreamDraft}
            setSubsystemDraft={c.setSubsystemDraft}
            setSubsystemDraftRisks={c.setSubsystemDraftRisks}
            setTaskDraft={c.setTaskDraft}
            showTimelineCreateToggleInTaskModal={c.showTimelineCreateToggleInTaskModal}
            onSwitchTaskCreateToMilestone={c.switchTaskCreateToMilestone}
            onOpenTaskEditFromTimelineDetails={c.openEditTaskModal}
            openTaskDetailsModal={c.openTimelineTaskDetailsModal}
            students={c.students}
            subsystemDraft={c.subsystemDraft}
            subsystemDraftRisks={c.subsystemDraftRisks}
            subsystemModalMode={c.subsystemModalMode}
            taskDraft={c.taskDraft}
            taskModalMode={c.taskModalMode}
          />
        </Suspense>
      ) : null}
    </main>
  );
}
