// @ts-nocheck
import { useEffect, useMemo } from "react";

import { useWorkspaceDerivedData } from "@/features/workspace/useWorkspaceDerivedData";
import type { AppWorkspaceState } from "@/app/useAppWorkspaceState";
import type { ViewTab } from "@/lib/workspaceNavigation";
import { findMemberForSessionUser } from "@/lib/appUtils";
import { scopeBootstrapBySelection } from "@/app/workspaceStateUtils";

export type AppWorkspaceDerived = ReturnType<typeof useAppWorkspaceDerived>;

export function useAppWorkspaceDerived(state: AppWorkspaceState) {
  const {
    activePersonFilter,
    activeTab,
    bootstrap,
    selectedProjectId,
    selectedSeasonId,
    setActiveTab,
    setSelectedProjectId,
    setSelectedSeasonId,
    activeTimelineTaskDetailId,
    setActiveTimelineTaskDetailId,
    sessionUser,
    setDataMessage,
    toggleSidebar,
    isSidebarOverlay,
  } = state;

  const projectsInSelectedSeason = useMemo(() => {
    if (!selectedSeasonId) {
      return bootstrap.projects;
    }

    return bootstrap.projects.filter((project) => project.seasonId === selectedSeasonId);
  }, [bootstrap.projects, selectedSeasonId]);

  const scopedBootstrap = useMemo(
    () => scopeBootstrapBySelection(bootstrap, selectedSeasonId, selectedProjectId),
    [bootstrap, selectedProjectId, selectedSeasonId],
  );

  const signedInMember = useMemo(
    () => findMemberForSessionUser(scopedBootstrap.members, sessionUser),
    [scopedBootstrap.members, sessionUser],
  );

  const selectedProject = useMemo(
    () =>
      projectsInSelectedSeason.find((project) => project.id === selectedProjectId) ?? null,
    [projectsInSelectedSeason, selectedProjectId],
  );

  const selectedProjectType = selectedProject?.projectType ?? null;
  const isAllProjectsView = selectedProjectId === null;
  const isNonRobotProject =
    selectedProjectType !== null && selectedProjectType !== "robot";
  const subsystemsLabel = isNonRobotProject ? "Workflow" : "Subsystems";

  const scopedArtifacts = useMemo(() => {
    const activeProjectIds = new Set(
      scopedBootstrap.projects.map((project) => project.id),
    );
    return bootstrap.artifacts.filter((artifact) =>
      activeProjectIds.has(artifact.projectId),
    );
  }, [bootstrap.artifacts, scopedBootstrap.projects]);

  const {
    activeTask,
    cncItems,
    disciplinesById,
    eventsById,
    externalMembers,
    fabricationItems,
    mechanismsById,
    mentors,
    membersById,
    navigationItems,
    partDefinitionsById,
    partInstancesById,
    printItems,
    rosterMentors,
    students,
    subsystemsById,
  } = useWorkspaceDerivedData({
    activeTaskId: state.activeTaskId,
    bootstrap: scopedBootstrap,
    isAllProjectsView,
    selectedProjectType,
  });

  const activeTimelineTaskDetail = useMemo(
    () =>
      activeTimelineTaskDetailId
        ? scopedBootstrap.tasks.find((task) => task.id === activeTimelineTaskDetailId) ?? null
        : null,
    [activeTimelineTaskDetailId, scopedBootstrap.tasks],
  );

  const visibleTabs = useMemo(
    () => new Set<ViewTab>(navigationItems.map((item) => item.value)),
    [navigationItems],
  );

  useEffect(() => {
    if (!visibleTabs.has(activeTab)) {
      setActiveTab("tasks");
    }
  }, [activeTab, setActiveTab, visibleTabs]);

  useEffect(() => {
    if (!activeTimelineTaskDetailId) {
      return;
    }

    if (!scopedBootstrap.tasks.some((task) => task.id === activeTimelineTaskDetailId)) {
      setActiveTimelineTaskDetailId(null);
    }
  }, [activeTimelineTaskDetailId, scopedBootstrap.tasks, setActiveTimelineTaskDetailId]);

  const isWorkspaceModalOpen = Boolean(
    activeTimelineTaskDetailId ||
      state.taskModalMode ||
      state.workLogModalMode ||
      state.qaReportModalMode ||
      state.eventReportModalMode ||
      state.purchaseModalMode ||
      state.manufacturingModalMode ||
      state.materialModalMode ||
      state.partDefinitionModalMode ||
      state.partInstanceModalMode ||
      state.subsystemModalMode ||
      state.mechanismModalMode ||
      state.artifactModalMode ||
      state.workstreamModalMode ||
      state.isAddSeasonPopupOpen ||
      state.robotProjectModalMode,
  );

  const closeSidebarOverlay = () => {
    if (isSidebarOverlay) {
      toggleSidebar();
    }
  };

  const handleSidebarTabSelect = (tab: ViewTab) => {
    if (tab !== activeTab) {
      const currentIndex = navigationItems.findIndex((item) => item.value === activeTab);
      const nextIndex = navigationItems.findIndex((item) => item.value === tab);

      if (currentIndex >= 0 && nextIndex >= 0) {
        state.setTabSwitchDirection(nextIndex > currentIndex ? "down" : "up");
      }

      setActiveTab(tab);
    }
    closeSidebarOverlay();
  };

  return {
    activeTask,
    activeTimelineTaskDetail,
    activeWorkstreamId: state.activeWorkstreamId,
    activePersonFilter,
    activeTab,
    artifactDraft: state.artifactDraft,
    artifactModalMode: state.artifactModalMode,
    authConfig: state.authConfig,
    authMessage: state.authMessage,
    bootstrap,
    cncItems,
    clearAuthMessage: state.clearAuthMessage,
    dataMessage: state.dataMessage,
    disciplinesById,
    eventsById,
    eventReportDraft: state.eventReportDraft,
    eventReportFindings: state.eventReportFindings,
    eventReportModalMode: state.eventReportModalMode,
    externalMembers,
    fabricationItems,
    handleSidebarTabSelect,
    isAllProjectsView,
    isDarkMode: state.isDarkMode,
    isEmailAuthAvailable: state.isEmailAuthAvailable,
    isGoogleAuthAvailable: state.isGoogleAuthAvailable,
    isLoadingData: state.isLoadingData,
    isMyViewActive:
      Boolean(signedInMember) &&
      activePersonFilter.length === 1 &&
      activePersonFilter[0] === signedInMember?.id,
    isNonRobotProject,
    isSidebarCollapsed: state.isSidebarCollapsed,
    isSidebarOverlay,
    isSigningIn: state.isSigningIn,
    isWorkspaceModalOpen,
    mechanismsById,
    mentors,
    membersById,
    navigationItems,
    pageShellStyle: state.pageShellStyle,
    partDefinitionsById,
    partInstancesById,
    printItems,
    projectsInSelectedSeason,
    qaReportDraft: state.qaReportDraft,
    qaReportModalMode: state.qaReportModalMode,
    reportsView: state.reportsView,
    riskManagementView: state.riskManagementView,
    rosterMentors,
    students,
    scopedArtifacts,
    scopedBootstrap,
    selectedMemberId: state.selectedMemberId,
    selectedProject,
    selectedProjectType,
    selectedSeasonId,
    sessionUser,
    setActivePersonFilter: state.setActivePersonFilter,
    setActiveTab,
    setArtifactDraft: state.setArtifactDraft,
    setArtifactModalMode: state.setArtifactModalMode,
    setDataMessage,
    setEventReportDraft: state.setEventReportDraft,
    setEventReportFindings: state.setEventReportFindings,
    setEventReportModalMode: state.setEventReportModalMode,
    setInventoryView: state.setInventoryView,
    setIsAddPersonOpen: state.setIsAddPersonOpen,
    setIsAddSeasonPopupOpen: state.setIsAddSeasonPopupOpen,
    setManufacturingDraft: state.setManufacturingDraft,
    setManufacturingModalMode: state.setManufacturingModalMode,
    setMaterialDraft: state.setMaterialDraft,
    setMaterialModalMode: state.setMaterialModalMode,
    setMechanismDraft: state.setMechanismDraft,
    setMechanismModalMode: state.setMechanismModalMode,
    setMemberEditDraft: state.setMemberEditDraft,
    setMemberForm: state.setMemberForm,
    setPartDefinitionDraft: state.setPartDefinitionDraft,
    setPartDefinitionModalMode: state.setPartDefinitionModalMode,
    setPartInstanceDraft: state.setPartInstanceDraft,
    setPartInstanceModalMode: state.setPartInstanceModalMode,
    setPurchaseDraft: state.setPurchaseDraft,
    setPurchaseFinalCost: state.setPurchaseFinalCost,
    setPurchaseModalMode: state.setPurchaseModalMode,
    setQaReportDraft: state.setQaReportDraft,
    setQaReportModalMode: state.setQaReportModalMode,
    setReportsView: state.setReportsView,
    setRiskManagementView: state.setRiskManagementView,
    setRobotProjectModalMode: state.setRobotProjectModalMode,
    setRobotProjectNameDraft: state.setRobotProjectNameDraft,
    setSeasonNameDraft: state.setSeasonNameDraft,
    setSelectedMemberId: state.setSelectedMemberId,
    setSelectedProjectId,
    setSelectedSeasonId,
    setShowTimelineCreateToggleInTaskModal: state.setShowTimelineCreateToggleInTaskModal,
    setSubsystemDraft: state.setSubsystemDraft,
    setSubsystemDraftRisks: state.setSubsystemDraftRisks,
    setSubsystemModalMode: state.setSubsystemModalMode,
    setTabSwitchDirection: state.setTabSwitchDirection,
    setTaskDraft: state.setTaskDraft,
    setTaskEditNotice: state.setTaskEditNotice,
    setTaskModalMode: state.setTaskModalMode,
    setTaskView: state.setTaskView,
    setTimelineMilestoneCreateSignal: state.setTimelineMilestoneCreateSignal,
    setWorkLogDraft: state.setWorkLogDraft,
    setWorkLogModalMode: state.setWorkLogModalMode,
    setWorklogsView: state.setWorklogsView,
    setWorkstreamDraft: state.setWorkstreamDraft,
    setWorkstreamModalMode: state.setWorkstreamModalMode,
    showTimelineCreateToggleInTaskModal: state.showTimelineCreateToggleInTaskModal,
    signedInMember,
    subsystemDraft: state.subsystemDraft,
    subsystemDraftRisks: state.subsystemDraftRisks,
    subsystemModalMode: state.subsystemModalMode,
    subsystemsById,
    subsystemsLabel,
    tabSwitchDirection: state.tabSwitchDirection,
    taskDraft: state.taskDraft,
    taskEditNotice: state.taskEditNotice,
    taskModalMode: state.taskModalMode,
    taskView: state.taskView,
    timelineMilestoneCreateSignal: state.timelineMilestoneCreateSignal,
    toggleDarkMode: state.toggleDarkMode,
    toggleMyView: () => {
      if (!signedInMember) {
        return;
      }

      setDataMessage(null);
      state.setActivePersonFilter((current) =>
        current.length === 1 && current[0] === signedInMember.id
          ? []
          : [signedInMember.id],
      );
    },
    toggleSidebar: state.toggleSidebar,
    workLogDraft: state.workLogDraft,
    workLogModalMode: state.workLogModalMode,
    worklogsView: state.worklogsView,
    workstreamDraft: state.workstreamDraft,
    workstreamModalMode: state.workstreamModalMode,
    closeSidebarOverlay,
  };
}
