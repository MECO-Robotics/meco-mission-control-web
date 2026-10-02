import { InteractiveTutorialOverlay } from "@/app/interactiveTutorial/InteractiveTutorialOverlay";
import type { AppWorkspaceController } from "@/app/hooks/useAppWorkspaceController";
import { mergeWorkspaceShellController } from "./workspaceShellController";
import { useWorkspaceShellNavigation } from "./useWorkspaceShellNavigation";
import { Suspense } from "react";
import { resetLocalDemo } from "@/lib/localWorkspace/session";
import { AddSeasonPopup, RobotProjectPopup, SidebarOverlay } from "./AppWorkspaceShellOverlays";
import { AppTopbar, AppSidebar, WorkspaceModalHost, WorkspaceContent, WorkspaceShellLoading } from "./workspaceShell";

export function AppWorkspaceShellView({ controller }: { controller: AppWorkspaceController }) {
  const c = mergeWorkspaceShellController(controller);
  const {
    localMode,
    activeSubItemId,
    activeViewLabel,
    handleSelectNavigationTarget,
    handleOpenProfileEditor,
    handleCreateMilestone,
    handleSelectSeason,
    handleSelectProject,
  } = useWorkspaceShellNavigation(c);
  return (
    <main
      className={`page-shell ${c.isDarkMode ? "dark-mode" : ""} ${c.isSidebarCollapsed ? "is-sidebar-collapsed" : ""} ${c.isSidebarOverlay ? "is-sidebar-overlay" : ""}`}
      data-task-view={c.taskView}
      data-navigation-view={activeSubItemId ?? "help"}
      style={c.pageShellStyle}
    >
      <Suspense fallback={<WorkspaceShellLoading />}>
        <AppTopbar
      activeViewLabel={activeViewLabel}
      isDarkMode={c.isDarkMode}
      isSidebarCollapsed={c.isSidebarCollapsed}
      onCreateMilestone={handleCreateMilestone}
      onCreatePart={c.openCreatePartDefinitionModal}
      onCreateQaReport={c.openCreateQaReportModal}
      onCreateTask={c.openCreateTaskModal}
    />
        <AppSidebar
      activeTab={c.activeTab}
      canSignIn={c.enforcedAuthConfig !== null && c.sessionUser === null}
      handleSignOut={c.handleSignOut}
      isDarkMode={c.isDarkMode}
      onSelectTarget={handleSelectNavigationTarget}
      isCollapsed={c.isSidebarCollapsed}
      isNotificationQueueOpen={c.isNotificationQueueOpen}
      notificationCount={c.notificationHistory.length}
      onCreateMilestone={handleCreateMilestone}
      onCreatePart={c.openCreatePartDefinitionModal}
      onCreateQaReport={c.openCreateQaReportModal}
      onCreateSeason={c.handleCreateSeason}
      onCreateTask={c.openCreateTaskModal}
      onRefreshWorkspace={c.loadWorkspace}
      onSignIn={c.requestSignIn}
      onSelectSeason={handleSelectSeason}
      onOpenProfileEditor={handleOpenProfileEditor}
      onToggleNotificationQueue={c.toggleNotificationQueue}
      toggleSidebar={c.toggleSidebar}
      projects={c.projectsInSelectedSeason}
      selectedProjectId={c.selectedProjectId}
      selectedSeasonId={c.selectedSeasonId}
      inventoryView={c.inventoryView}
      seasons={c.bootstrap.seasons}
      sessionUser={c.sessionUser}
      taskView={c.taskView}
      toggleDarkMode={c.toggleDarkMode}
      worklogsView={c.worklogsView}
      onSelectProject={handleSelectProject}
      onCreateRobot={c.handleCreateRobot}
      onEditSelectedRobot={c.handleEditSelectedRobot}
      onEnqueueNotification={c.enqueueTaskEditNotice}
      localMode={localMode}
      onResetDemo={() => {
        try {
          resetLocalDemo();
          c.setSelectedSeasonId("default-season");
          c.setSelectedProjectId(null);
          void c.loadWorkspace({ seasonId: "default-season", projectId: null, personId: null });
        } catch (error) {
          c.setDataMessage(error instanceof Error ? error.message : "The local demo could not be reset.");
        }
       }}
    />
        {c.isAddSeasonPopupOpen ? <AddSeasonPopup controller={c} /> : null}
        {c.robotProjectModalMode ? <RobotProjectPopup controller={c} /> : null}
        <SidebarOverlay controller={c} />
        <WorkspaceContent
          {...c}
          allMembers={c.bootstrap.members}
          artifacts={c.scopedArtifacts}
          availabilityBootstrap={c.bootstrap}
          bootstrap={c.scopedBootstrap}
          onDeleteRisk={c.handleDeleteRisk}
          onUpdateRisk={c.handleUpdateRisk}
          showCncMentorQuickActions={
            c.signedInMember?.role === "mentor" ||
            c.signedInMember?.role === "admin" ||
            Boolean(c.signedInMember?.elevated)
          }
          disablePanelAnimations={c.isWorkspaceModalOpen}
          onDismissDataMessage={c.clearDataMessage}
          onDismissNotificationHistoryItem={c.dismissNotificationHistoryItem}
          onDismissTaskEditNotice={c.dismissTaskEditNotice}
          onTaskEditCanceled={c.notifyTaskEditCanceled}
          onTaskEditSaved={c.notifyTaskEditSaved}
          onStartInteractiveTutorial={() => void c.startInteractiveTutorial("planning")}
          onStartInteractiveTutorialChapter={(chapterId) => void c.startInteractiveTutorial(chapterId)}
        />
      </Suspense>

      <>
      {c.interactiveTutorialOverlayProps ? (
        <InteractiveTutorialOverlay {...c.interactiveTutorialOverlayProps} />
      ) : null}

      {c.isWorkspaceModalOpen ? (
        <Suspense fallback={null}>
          <WorkspaceModalHost
            {...c}
            bootstrap={c.scopedBootstrap}
            onTaskEditCanceled={c.notifyTaskEditCanceled}
          />
        </Suspense>
      ) : null}
    </>
    </main>
  );
}
