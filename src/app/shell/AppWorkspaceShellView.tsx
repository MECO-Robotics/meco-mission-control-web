import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { InteractiveTutorialOverlay } from "@/app/interactiveTutorial/InteractiveTutorialOverlay";
import {
  BASE_SECTION_LABELS,
  NAVIGATION_SECTION_LABELS,
  NAVIGATION_SUB_ITEMS,
  getActiveNavigationSubItemId,
  getNavigationSectionFromSubItem,
  resolveViewAvailabilityContext,
  isNavigationSubItemAvailable,
  getNavigationTarget,
  readNavigationLocation,
  targetMatchesNavigationState,
  writeNavigationLocation,
  type NavigationTarget,
} from "@/lib/workspaceNavigation";

import { getLocalWorkspaceMode, resetLocalDemo, subscribeLocalWorkspace } from "@/lib/localWorkspace/session";
import { findMemberForSessionUser } from "@/lib/appUtils/common";
import { Suspense, useSyncExternalStore, useEffect, useLayoutEffect, useRef } from "react";

import type { AppWorkspaceController } from "@/app/hooks/useAppWorkspaceController";
import { AddSeasonPopup, RobotProjectPopup, SidebarOverlay } from "./AppWorkspaceShellOverlays";
import { AppTopbar, AppSidebar, WorkspaceModalHost, WorkspaceContent, WorkspaceShellLoading } from "./workspaceShell";

export function AppWorkspaceShellView({ controller }: { controller: AppWorkspaceController }) {
  const localMode = useSyncExternalStore(subscribeLocalWorkspace, getLocalWorkspaceMode, () => null);
  const c = { ...controller.model, ...controller.model.taskEditor, ...controller.model.eventActions, ...controller.reportActions,
    ...controller.rosterActions, ...controller.model.artifactEditor, ...controller.model.workstreamEditor, ...controller.model.partDefinitionEditor, ...controller.model.partInstanceEditor, ...controller.model.subsystemEditor, ...controller.model.mechanismEditor, ...controller.model.purchaseEditor, ...controller.model.manufacturingEditor, ...controller.model.materialEditor };
  const navigationContext = resolveViewAvailabilityContext({
    hasProjects: c.projectsInSelectedSeason.length > 0,
    hasSeasons: c.bootstrap.seasons.length > 0,
    selectedProjectType: c.selectedProject?.projectType ?? null,
  });
  const { activeTab, inventoryView, manufacturingView, rosterView, taskView, worklogsView } = c;
  const navigationState = ({ activeTab, inventoryView, manufacturingView, rosterView, taskView, worklogsView });
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
  const handleSelectNavigationTarget = (target: NavigationTarget, options?: { keepSidebarOpen?: boolean }) => {
    if (!restoringLocation.current) window.history.replaceState({ ...window.history.state, scrollY: window.scrollY }, "");
    const destinationUrl = new URL(window.location.href);
    if (target.milestoneId) destinationUrl.searchParams.set("milestone", target.milestoneId);
    else if (target.tab !== "tasks" || target.taskView === "queue" || target.taskView === "robot-map") destinationUrl.searchParams.delete("milestone");
    if (destinationUrl.href !== window.location.href) window.history.replaceState(window.history.state, "", destinationUrl);
    if (target.taskView) {
      c.setTaskView(target.taskView);
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
  const handleOpenProfileEditor = () => {
    const memberId = c.signedInMember?.id ??
      findMemberForSessionUser(c.bootstrap.members, c.sessionUser)?.id;
    if (!memberId) {
      c.setDataMessage("Your profile is not available in the current roster.");
      return;
    }
    c.selectMember(memberId, c.bootstrap);
    c.setIsAddPersonOpen(false);
    c.setIsEditPersonOpen(true);
    c.handleSidebarTabSelect("roster");
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
    c.restoreTimelineTaskDetails(restoringTask.current);
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
        c.restoreTimelineTaskDetails(taskId);
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
  const handleSelectSeason = (seasonId: string | null) => {
    c.setSelectedSeasonId(seasonId);
    c.setSelectedProjectId(null);
    void c.loadWorkspace({ seasonId, projectId: null, personId: null });
  };
  const handleSelectProject = (projectId: string | null) => {
    c.setSelectedProjectId(projectId);
    void c.loadWorkspace({
      seasonId: c.selectedSeasonId,
      projectId,
      personId: null,
    });
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
      activeViewLabel={activeViewLabel}
      isDarkMode={c.isDarkMode}
      isSidebarCollapsed={c.isSidebarCollapsed}
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
      manufacturingView={c.manufacturingView}
      rosterView={c.rosterView}
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
          currentMemberId={c.signedInMember?.id ?? null}
          allMembers={c.bootstrap.members}
          artifacts={c.scopedArtifacts}
          availabilityBootstrap={c.bootstrap}
          bootstrap={c.scopedBootstrap}
          onDeleteRisk={c.handleDeleteRisk}
          onCncQuickStatusChange={c.handleCncQuickStatusChange}
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
