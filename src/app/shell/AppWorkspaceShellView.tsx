import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { InteractiveTutorialOverlay } from "@/app/interactiveTutorial/InteractiveTutorialOverlay";
import {
  type NavigationSubItemId,
  BASE_SECTION_LABELS,
  NAVIGATION_SECTION_LABELS,
  NAVIGATION_SUB_ITEMS,
  getActiveNavigationSubItemId,
  getNavigationSectionFromSubItem,
  normalizeNavigationSubItemId,
  resolveViewAvailabilityContext,
  isNavigationSubItemAvailable,
  getNavigationTarget,
  readNavigationLocation,
  targetMatchesNavigationState,
  writeNavigationLocation,
  type NavigationTarget,
} from "@/lib/workspaceNavigation";

import { getLocalWorkspaceMode, resetLocalDemo, subscribeLocalWorkspace } from "@/lib/localWorkspace/session";
import { Suspense, useSyncExternalStore, useEffect, useLayoutEffect, useRef } from "react";

import type { AppWorkspaceController } from "@/app/hooks/useAppWorkspaceController";
import { AddSeasonPopup, RobotProjectPopup, SidebarOverlay } from "./AppWorkspaceShellOverlays";
import { AppTopbar, AppSidebar, WorkspaceModalHost, WorkspaceContent, WorkspaceShellLoading } from "./workspaceShell";

export function AppWorkspaceShellView({ controller }: { controller: AppWorkspaceController }) {
  const localMode = useSyncExternalStore(subscribeLocalWorkspace, getLocalWorkspaceMode, () => null);
  const c = { ...controller.model, ...controller.taskActions, ...controller.reportActions,
    ...controller.catalogActions, ...controller.rosterActions, ...controller.model.materialEditor };
  const content = c;
  const navigationContext = resolveViewAvailabilityContext({
    hasProjects: c.projectsInSelectedSeason.length > 0,
    hasSeasons: c.bootstrap.seasons.length > 0,
    selectedProjectType: c.selectedProject?.projectType ?? null,
  });
  const { activeTab, inventoryView, manufacturingView, rosterView, riskManagementView, taskView, worklogsView } = c;
  const navigationState = ({ activeTab, inventoryView, manufacturingView, rosterView, riskManagementView, taskView, worklogsView });
  const activeSubItemId = getActiveNavigationSubItemId(navigationState, navigationContext);
  const activeSection = activeSubItemId
    ? getNavigationSectionFromSubItem(activeSubItemId)
    : null;
  const activeSectionLabel = activeSection
    ? NAVIGATION_SECTION_LABELS[activeSection]
    : BASE_SECTION_LABELS[c.activeTab];
  const activeViewLabel =
    activeSubItemId
      ? NAVIGATION_SUB_ITEMS.find((subItem) => subItem.id === activeSubItemId)?.label ??
        activeSectionLabel
      : activeSectionLabel;
  const favoriteViewIds = new Set(
    (c.bootstrap.favoriteViews ?? [])
      .map((favorite) => normalizeNavigationSubItemId(favorite.viewId))
      .filter((favoriteViewId): favoriteViewId is NavigationSubItemId => favoriteViewId !== null),
  );
  const isActiveViewFavorite = activeSubItemId ? favoriteViewIds.has(activeSubItemId) : false;

  const handleSelectNavigationTarget = (target: NavigationTarget, options?: { keepSidebarOpen?: boolean }) => {
    if (!restoringLocation.current) window.history.replaceState({ ...window.history.state, scrollY: window.scrollY }, "");
    const destinationUrl = new URL(window.location.href);
    if (target.milestoneId) destinationUrl.searchParams.set("milestone", target.milestoneId);
    else if (target.tab !== "tasks" || target.taskView === "queue" || target.taskView === "robot-map") destinationUrl.searchParams.delete("milestone");
    if (destinationUrl.href !== window.location.href) window.history.replaceState(window.history.state, "", destinationUrl);
    if (target.taskView) {
      c.setTaskView(target.taskView);
    }

    if (target.riskManagementView) {
      c.setRiskManagementView(target.riskManagementView);
    }

    if (target.worklogsView) {
      c.setWorklogsView(target.worklogsView);
    }

    if (target.inventoryView) {
      c.setInventoryView(target.inventoryView);
    }

    if (target.manufacturingView) {
      c.setManufacturingView(target.manufacturingView);
    }

    if (target.rosterView) {
      c.setRosterView(target.rosterView);
    }

    c.handleSidebarTabSelect(target.tab, {
      keepSidebarOpen: options?.keepSidebarOpen,
    });
  };
  const availableViews = NAVIGATION_SUB_ITEMS
    .filter((view) => isNavigationSubItemAvailable(view.id, { context: navigationContext }))
    .map((view) => ({ ...view, target: getNavigationTarget(view.id, navigationContext) }));
  const restoreNavigation = () => {
    const params = new URLSearchParams(window.location.search);
    const seasonId = params.get("season");
    const projectId = params.get("project");
    const project = c.bootstrap.projects.find((item) => item.id === projectId);
    const context = resolveViewAvailabilityContext({
      hasProjects: c.bootstrap.projects.length > 0, hasSeasons: c.bootstrap.seasons.length > 0,
      selectedProjectType: project?.projectType ?? null,
    });
    c.setSelectedSeasonId(seasonId);
    c.setSelectedProjectId(project?.id ?? null);
    const target = readNavigationLocation(window.location.search, context);
    restoringLocation.current = target;
    const taskId = params.get("task");
    restoringTask.current = taskId && c.bootstrap.tasks.some((task) => task.id === taskId && (!projectId || task.projectId === projectId)) ? taskId : null;
    restoringScroll.current = Number(window.history.state?.scrollY ?? 0);
    c.setActiveTimelineTaskDetailId(restoringTask.current);
    handleSelectNavigationTarget(target);
  };
  const navigationRef = useRef({ navigate: handleSelectNavigationTarget, restore: restoreNavigation });
  navigationRef.current = { navigate: handleSelectNavigationTarget, restore: restoreNavigation };
  const locationInitialized = useRef(false);
  const restoringLocation = useRef<NavigationTarget | null>(null);
  const restoringTask = useRef<string | null | undefined>(undefined);
  const restoringScroll = useRef(0);
  const scopeParams = new URLSearchParams(window.location.search);
  if (c.selectedSeasonId) scopeParams.set("season", c.selectedSeasonId); else scopeParams.delete("season");
  if (c.selectedProjectId) scopeParams.set("project", c.selectedProjectId); else scopeParams.delete("project");
  if (c.activeTimelineTaskDetailId) scopeParams.set("task", c.activeTimelineTaskDetailId); else scopeParams.delete("task");
  const previousContext = useRef(navigationContext);
  const currentSearch = writeNavigationLocation(navigationState, navigationContext, scopeParams.toString());
  useLayoutEffect(() => {
    if (c.isLoadingData || c.bootstrap === EMPTY_BOOTSTRAP) return;
    if (!locationInitialized.current) {
      locationInitialized.current = true;
      const target = readNavigationLocation(window.location.search, navigationContext);
      const requestedTask = new URLSearchParams(window.location.search).get("task");
      const taskId = requestedTask && c.scopedBootstrap.tasks.some((task) => task.id === requestedTask) ? requestedTask : null;
      if (!targetMatchesNavigationState(target, navigationState) || taskId !== c.activeTimelineTaskDetailId) {
        restoringLocation.current = target;
        restoringTask.current = taskId;
        restoringScroll.current = Number(window.history.state?.scrollY ?? 0);
        c.setActiveTimelineTaskDetailId(taskId);
        navigationRef.current.navigate(target);
        return;
      }
      window.history.replaceState({ ...window.history.state, scrollY: window.history.state?.scrollY ?? window.scrollY }, "", `${window.location.pathname}${currentSearch}${window.location.hash}`);
    }
    if (!restoringLocation.current && previousContext.current !== navigationContext) {
      previousContext.current = navigationContext;
      const currentId = getActiveNavigationSubItemId(navigationState, navigationContext);
      const currentView = availableViews.find((view) => view.id === currentId);
      const fallback = currentView ?? availableViews.find((view) => view.section === activeSection) ?? availableViews[0];
      if (fallback && (!currentView || (currentId === "resources-structure" && navigationContext !== "robot-project"))) {
        navigationRef.current.navigate(fallback.target);
        return;
      }
    }
    if (restoringLocation.current) {
      const target = restoringLocation.current;
      const matches = targetMatchesNavigationState(target, navigationState);
      if (!matches || (restoringTask.current !== undefined && restoringTask.current !== c.activeTimelineTaskDetailId)) return;
      restoringLocation.current = null;
      restoringTask.current = undefined;
      window.history.replaceState({ ...window.history.state, scrollY: restoringScroll.current }, "", `${window.location.pathname}${currentSearch}${window.location.hash}`);
      window.requestAnimationFrame(() => window.scrollTo({ top: restoringScroll.current, behavior: "instant" }));
    } else if (window.location.search !== currentSearch) {
      const previous = new URLSearchParams(window.location.search);
      const next = new URLSearchParams(currentSearch);
      const sameSurface = ["view", "mode", "project", "season", "utility"].every((key) => previous.get(key) === next.get(key));
      window.history.pushState({ scrollY: sameSurface ? window.scrollY : 0 }, "", `${window.location.pathname}${currentSearch}${window.location.hash}`);
      if (!sameSurface) window.scrollTo({ top: 0, behavior: "instant" });
    }
  });
  useEffect(() => {
    const restore = () => navigationRef.current.restore();
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const rememberScroll = () => {
      if (!restoringLocation.current) window.history.replaceState({ ...window.history.state, scrollY: window.scrollY }, "");
    };
    window.addEventListener("scroll", rememberScroll, { passive: true });
    window.addEventListener("popstate", restore);
    return () => {
      window.removeEventListener("scroll", rememberScroll);
      window.history.scrollRestoration = previousRestoration;
      window.removeEventListener("popstate", restore);
    };
  }, []);
  const handleCreateMilestone = () => {
    handleSelectNavigationTarget({ tab: "tasks", taskView: "timeline" });
    c.switchTaskCreateToMilestone();
  };

  return (
    <main
      className={`page-shell ${c.isDarkMode ? "dark-mode" : ""} ${c.isSidebarCollapsed ? "is-sidebar-collapsed" : ""} ${c.isSidebarOverlay ? "is-sidebar-overlay" : ""}`}
      data-task-view={c.taskView}
      data-navigation-view={activeSubItemId ?? "help"}
      style={c.pageShellStyle}
    >
      <Suspense fallback={<WorkspaceShellLoading />}>
        <AppTopbar
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
      activeViewLabel={activeViewLabel}
      isActiveViewFavorite={isActiveViewFavorite}
      onToggleActiveViewFavorite={
        activeSubItemId
          ? () => void c.toggleFavoriteView(activeSubItemId, !isActiveViewFavorite)
          : null
      }
      isDarkMode={c.isDarkMode}
      isSidebarCollapsed={c.isSidebarCollapsed}
    />
        <AppSidebar
          favoriteViewIds={[...favoriteViewIds]}
      activeTab={c.activeTab}
      canSignIn={c.enforcedAuthConfig !== null && c.sessionUser === null}
      handleSignOut={c.handleSignOut}
      isDarkMode={c.isDarkMode}
      isMyViewActive={c.isMyViewActive}
      onSelectTarget={handleSelectNavigationTarget}
      isCollapsed={c.isSidebarCollapsed}
      isNotificationQueueOpen={c.isNotificationQueueOpen}
      myViewMemberName={c.signedInMember?.name ?? null}
      notificationCount={c.notificationHistory.length}
      onCreateMilestone={handleCreateMilestone}
      onCreatePart={c.openCreatePartDefinitionModal}
      onCreateQaReport={c.openCreateQaReportModal}
      onCreateSeason={c.handleCreateSeason}
      onCreateTask={c.openCreateTaskModal}
      onRefreshWorkspace={c.loadWorkspace}
      onSignIn={c.requestSignIn}
      onSelectSeason={c.setSelectedSeasonId}
      onToggleMyView={c.toggleMyView}
      onToggleNotificationQueue={c.toggleNotificationQueue}
      toggleSidebar={c.toggleSidebar}
      projects={c.projectsInSelectedSeason}
      selectedProjectId={c.selectedProjectId}
      selectedSeasonId={c.selectedSeasonId}
      inventoryView={c.inventoryView}
      manufacturingView={c.manufacturingView}
      rosterView={c.rosterView}
      riskManagementView={c.riskManagementView}
      seasons={c.bootstrap.seasons}
      sessionUser={c.sessionUser}
      taskView={c.taskView}
      toggleDarkMode={c.toggleDarkMode}
      worklogsView={c.worklogsView}
      onSelectProject={c.setSelectedProjectId}
      onCreateRobot={c.handleCreateRobot}
      onEditSelectedRobot={c.handleEditSelectedRobot}
    />
        {c.isAddSeasonPopupOpen ? <AddSeasonPopup controller={c} /> : null}
        {c.robotProjectModalMode ? <RobotProjectPopup controller={c} /> : null}
        <SidebarOverlay controller={c} />
        <WorkspaceContent
          currentMemberId={content.signedInMember?.id ?? null}
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

      <>
      {c.interactiveTutorialOverlayProps ? (
        <InteractiveTutorialOverlay {...c.interactiveTutorialOverlayProps} />
      ) : null}

      {c.isWorkspaceModalOpen ? (
        <Suspense fallback={null}>
          <WorkspaceModalHost
            openCreateWorkLogModal={c.openCreateWorkLogModal}
            openCreateQaReportModal={c.openCreateQaReportModal}
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
            closeMilestoneReportModal={c.closeMilestoneReportModal}
            closeTimelineTaskDetailsModal={c.closeTimelineTaskDetailsModal}
            closeWorkLogModal={c.closeWorkLogModal}
            closeSubsystemModal={c.closeSubsystemModal}
            closeTaskModal={c.closeTaskModal}
            closeWorkstreamModal={c.closeWorkstreamModal}
            onTaskEditCanceled={c.notifyTaskEditCanceled}
            requestPhotoUpload={c.requestPhotoUpload}
            disciplinesById={c.disciplinesById}
            milestonesById={c.milestonesById}
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
            handleMilestoneReportSubmit={c.handleMilestoneReportSubmit}
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
            isSavingMilestoneReport={c.isSavingMilestoneReport}
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
            milestoneReportDraft={c.milestoneReportDraft}
            milestoneReportFindings={c.milestoneReportFindings}
            milestoneReportModalMode={c.milestoneReportModalMode}
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
            setMilestoneReportDraft={c.setMilestoneReportDraft}
            setMilestoneReportFindings={c.setMilestoneReportFindings}
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
    </>
    </main>
  );
}
