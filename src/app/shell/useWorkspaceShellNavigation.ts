import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import {
  BASE_SECTION_LABELS,
  NAVIGATION_SECTION_LABELS,
  NAVIGATION_SUB_ITEMS,
  getActiveNavigationSubItemId,
  getNavigationSectionFromSubItem,
  getNavigationTarget,
  isNavigationSubItemAvailable,
  readNavigationLocation,
  resolveViewAvailabilityContext,
  targetMatchesNavigationState,
  writeNavigationLocation,
  type NavigationTarget,
} from "@/lib/workspaceNavigation";
import { findMemberForSessionUser } from "@/lib/appUtils/common";
import { getLocalWorkspaceMode, subscribeLocalWorkspace } from "@/lib/localWorkspace/session";
import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import type { WorkspaceShellController } from "./workspaceShellController";

export function useWorkspaceShellNavigation(c: WorkspaceShellController) {
  const localMode = useSyncExternalStore(subscribeLocalWorkspace, getLocalWorkspaceMode, () => null);
  const navigationContext = resolveViewAvailabilityContext({
    hasProjects: c.projectsInSelectedSeason.length > 0,
    hasSeasons: c.bootstrap.seasons.length > 0,
    selectedProjectType: c.selectedProject?.projectType ?? null,
  });
  const { activeTab, inventoryView, manufacturingView, taskView, worklogsView } = c;
  const navigationState = { activeTab, inventoryView, manufacturingView, taskView, worklogsView };
  const activeSubItemId = getActiveNavigationSubItemId(navigationState, navigationContext);
  const activeSection = activeSubItemId ? getNavigationSectionFromSubItem(activeSubItemId) : null;
  const activeSectionLabel = activeSection
    ? NAVIGATION_SECTION_LABELS[activeSection]
    : BASE_SECTION_LABELS[c.activeTab];
  const activeViewLabel = activeSubItemId
    ? NAVIGATION_SUB_ITEMS.find(({ id }) => id === activeSubItemId)?.label ?? activeSectionLabel
    : activeSectionLabel;
  const handleSelectNavigationTarget = (target: NavigationTarget, options?: { keepSidebarOpen?: boolean }) => {
    if (!restoringLocation.current) window.history.replaceState({ ...window.history.state, scrollY: window.scrollY }, "");
    const destinationUrl = new URL(window.location.href);
    if (target.milestoneId) destinationUrl.searchParams.set("milestone", target.milestoneId);
    else if (target.tab !== "tasks" || target.taskView === "queue" || target.taskView === "robot-map") destinationUrl.searchParams.delete("milestone");
    if (destinationUrl.href !== window.location.href) window.history.replaceState(window.history.state, "", destinationUrl);
    if (target.taskView) c.setTaskView(target.taskView);
    if (target.worklogsView) c.setWorklogsView(target.worklogsView);
    if (target.inventoryView) c.setInventoryView(target.inventoryView);
    if (target.manufacturingView) c.setManufacturingView(target.manufacturingView);
    c.handleSidebarTabSelect(target.tab, { keepSidebarOpen: options?.keepSidebarOpen });
  };
  const restoreNavigation = () => {
    const params = new URLSearchParams(window.location.search);
    const seasonId = params.get("season");
    const projectId = params.get("project");
    const project = c.bootstrap.projects.find((item) => item.id === projectId);
    const context = resolveViewAvailabilityContext({
      hasProjects: c.bootstrap.projects.length > 0,
      hasSeasons: c.bootstrap.seasons.length > 0,
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
  const availableViews = NAVIGATION_SUB_ITEMS
    .filter(({ id }) => isNavigationSubItemAvailable(id, { context: navigationContext }))
    .map((view) => ({ ...view, target: getNavigationTarget(view.id, navigationContext) }));

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

  const handleOpenProfileEditor = () => {
    const memberId = c.signedInMember?.id ?? findMemberForSessionUser(c.bootstrap.members, c.sessionUser)?.id;
    if (!memberId) {
      c.setDataMessage("Your profile is not available in the current roster.");
      return;
    }
    c.selectMember(memberId, c.bootstrap);
    c.setIsAddPersonOpen(false);
    c.setIsEditPersonOpen(true);
    c.handleSidebarTabSelect("roster");
  };
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
    void c.loadWorkspace({ seasonId: c.selectedSeasonId, projectId, personId: null });
  };
  return {
    localMode, activeSubItemId, activeViewLabel, handleSelectNavigationTarget,
    handleOpenProfileEditor, handleCreateMilestone, handleSelectSeason, handleSelectProject,
  };
}
