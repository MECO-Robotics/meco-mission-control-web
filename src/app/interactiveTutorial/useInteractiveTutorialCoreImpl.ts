import {
  startTransition,
  useCallback,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { INTERACTIVE_TUTORIAL_CHAPTERS } from "@/app/interactiveTutorialData";
import { fetchBootstrap, resetInteractiveTutorialSession, startInteractiveTutorialSession } from "@/lib/auth";
import { toErrorMessage } from "@/lib/appUtils";
import type {
  FilterSelection,
  ManufacturingModalMode,
  MaterialModalMode,
  MechanismModalMode,
  SubsystemModalMode,
  TaskModalMode,
  WorkstreamModalMode,
} from "@/features/workspace";
import type { BootstrapPayload } from "@/types";
import type {
  InteractiveTutorialChapterId,
  InteractiveTutorialChapterOption,
  InteractiveTutorialCreationCounts,
  InteractiveTutorialOverlayProps,
  InteractiveTutorialReturnState,
} from "./interactiveTutorialTypes";
import {
  getInteractiveTutorialCreationCounts,
  isInteractiveTutorialCreationStep,
} from "./interactiveTutorialHelpers";
import { useInteractiveTutorialLifecycle } from "./useInteractiveTutorialLifecycle";

interface UseInteractiveTutorialOptions {
  activeTab: import("@/lib/workspaceNavigation").ViewTab;
  taskView: import("@/lib/workspaceNavigation").TaskViewTab;
  riskManagementView: import("@/lib/workspaceNavigation").RiskManagementViewTab;
  worklogsView: import("@/lib/workspaceNavigation").WorklogsViewTab;
  reportsView: import("@/lib/workspaceNavigation").ReportsViewTab;
  manufacturingView: import("@/lib/workspaceNavigation").ManufacturingViewTab;
  inventoryView: import("@/lib/workspaceNavigation").InventoryViewTab;
  selectedSeasonId: string | null;
  selectedProjectId: string | null;
  bootstrap: BootstrapPayload;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  closeSidebarOverlay: () => void;
  handleUnauthorized: () => void;
  setActiveTab: Dispatch<SetStateAction<import("@/lib/workspaceNavigation").ViewTab>>;
  setTaskView: Dispatch<SetStateAction<import("@/lib/workspaceNavigation").TaskViewTab>>;
  setRiskManagementView: Dispatch<SetStateAction<import("@/lib/workspaceNavigation").RiskManagementViewTab>>;
  setWorklogsView: Dispatch<SetStateAction<import("@/lib/workspaceNavigation").WorklogsViewTab>>;
  setReportsView: Dispatch<SetStateAction<import("@/lib/workspaceNavigation").ReportsViewTab>>;
  setManufacturingView: Dispatch<SetStateAction<import("@/lib/workspaceNavigation").ManufacturingViewTab>>;
  setInventoryView: Dispatch<SetStateAction<import("@/lib/workspaceNavigation").InventoryViewTab>>;
  setSelectedSeasonId: Dispatch<SetStateAction<string | null>>;
  setSelectedProjectId: Dispatch<SetStateAction<string | null>>;
  setActivePersonFilter: Dispatch<SetStateAction<FilterSelection>>;
  setBootstrap: Dispatch<SetStateAction<BootstrapPayload>>;
  setDataMessage: Dispatch<SetStateAction<string | null>>;
  activeTimelineTaskDetailId: string | null;
  taskModalMode: TaskModalMode;
  activeTaskId: string | null;
  materialModalMode: MaterialModalMode;
  activeMaterialId: string | null;
  subsystemModalMode: SubsystemModalMode;
  activeSubsystemId: string | null;
  mechanismModalMode: MechanismModalMode;
  activeMechanismId: string | null;
  manufacturingModalMode: ManufacturingModalMode;
  activeManufacturingId: string | null;
  workstreamModalMode: WorkstreamModalMode;
  activeWorkstreamId: string | null;
}

export function useInteractiveTutorial({
  activeTab,
  taskView,
  riskManagementView,
  worklogsView,
  reportsView,
  manufacturingView,
  inventoryView,
  selectedSeasonId,
  selectedProjectId,
  bootstrap,
  isSidebarCollapsed,
  toggleSidebar,
  closeSidebarOverlay,
  handleUnauthorized,
  setActiveTab,
  setTaskView,
  setRiskManagementView,
  setWorklogsView,
  setReportsView,
  setManufacturingView,
  setInventoryView,
  setSelectedSeasonId,
  setSelectedProjectId,
  setActivePersonFilter,
  setBootstrap,
  setDataMessage,
  activeTimelineTaskDetailId,
  taskModalMode,
  activeTaskId,
  materialModalMode,
  activeMaterialId,
  subsystemModalMode,
  activeSubsystemId,
  mechanismModalMode,
  activeMechanismId,
  manufacturingModalMode,
  activeManufacturingId,
  workstreamModalMode,
  activeWorkstreamId,
}: UseInteractiveTutorialOptions) {
  const [chapterId, setChapterId] = useState<InteractiveTutorialChapterId | null>(null);
  const [completedChapterId, setCompletedChapterId] = useState<InteractiveTutorialChapterId | null>(
    null,
  );
  const [completedChapters, setCompletedChapters] = useState<InteractiveTutorialChapterId[]>([]);
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [returnState, setReturnState] = useState<InteractiveTutorialReturnState | null>(null);
  const [tutorialSeasonName, setTutorialSeasonName] = useState<string | null>(null);
  const [tutorialSeasonId, setTutorialSeasonId] = useState<string | null>(null);
  const [tutorialProjectId, setTutorialProjectId] = useState<string | null>(null);
  const [tutorialProjectName, setTutorialProjectName] = useState<string | null>(null);
  const [bootstrapSnapshot, setBootstrapSnapshot] = useState<BootstrapPayload | null>(null);
  const [baselineCounts, setBaselineCounts] = useState<InteractiveTutorialCreationCounts | null>(
    null,
  );

  const chapters = INTERACTIVE_TUTORIAL_CHAPTERS;
  const chapterOrder = useMemo(() => chapters.map((chapter) => chapter.id), [chapters]);
  const activeChapter = useMemo(
    () =>
      chapterId ? chapters.find((chapter) => chapter.id === chapterId) ?? null : null,
    [chapterId, chapters],
  );
  const steps = activeChapter?.steps ?? [];
  const currentStep = stepIndex !== null ? steps[stepIndex] ?? null : null;
  const stepNumber = stepIndex !== null ? stepIndex + 1 : 0;
  const isInteractiveTutorialActive = chapterId !== null || completedChapterId !== null;
  const nextChapterId = useMemo(() => {
    if (!completedChapterId) {
      return null;
    }

    const index = chapterOrder.indexOf(completedChapterId);
    return index < 0 ? null : chapterOrder[index + 1] ?? null;
  }, [chapterOrder, completedChapterId]);
  const chapterStartOptions = useMemo(
    () =>
      chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        summary: chapter.summary,
        completed: completedChapters.includes(chapter.id),
      })) satisfies InteractiveTutorialChapterOption[],
    [chapters, completedChapters],
  );

  const resetLocalTutorialState = useCallback(() => {
    setStepIndex(null);
    setChapterId(null);
    setCompletedChapterId(null);
    setCompletedChapters([]);
    setTutorialSeasonName(null);
    setTutorialSeasonId(null);
    setTutorialProjectId(null);
    setTutorialProjectName(null);
    setBootstrapSnapshot(null);
    setBaselineCounts(null);
  }, []);

  const closeInteractiveTutorial = useCallback(async () => {
    const previousState = returnState;
    const previousBootstrap = bootstrapSnapshot;

    resetLocalTutorialState();

    if (previousBootstrap) {
      startTransition(() => {
        setBootstrap(previousBootstrap);
      });
    }

    if (previousState) {
      setActiveTab(previousState.activeTab);
      setTaskView(previousState.taskView);
      setRiskManagementView(previousState.riskManagementView);
      setWorklogsView(previousState.worklogsView);
      setReportsView(previousState.reportsView);
      setManufacturingView(previousState.manufacturingView);
      setInventoryView(previousState.inventoryView);
      setSelectedSeasonId(previousState.selectedSeasonId);
      setSelectedProjectId(previousState.selectedProjectId);
    }

    setReturnState(null);

    try {
      await resetInteractiveTutorialSession(handleUnauthorized);
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    }
  }, [
    bootstrapSnapshot,
    handleUnauthorized,
    resetLocalTutorialState,
    returnState,
    setActiveTab,
    setBootstrap,
    setDataMessage,
    setInventoryView,
    setManufacturingView,
    setReportsView,
    setRiskManagementView,
    setSelectedProjectId,
    setSelectedSeasonId,
    setTaskView,
    setWorklogsView,
  ]);

  const advanceInteractiveTutorial = useCallback(() => {
    if (stepIndex === null) {
      return;
    }

    if (stepIndex >= steps.length - 1) {
      if (chapterId) {
        setCompletedChapterId(chapterId);
        setCompletedChapters((current) => (current.includes(chapterId) ? current : [...current, chapterId]));
      }
      setStepIndex(null);
      return;
    }

    setStepIndex(stepIndex + 1);
  }, [chapterId, stepIndex, steps.length]);

  const startInteractiveTutorial = useCallback(
    async (requestedChapterId: string = "planning") => {
      if (stepIndex !== null) {
        return;
      }

      const chapter =
        chapters.find((candidate) => candidate.id === requestedChapterId) ?? chapters[0] ?? null;
      if (!chapter || chapter.steps.length === 0) {
        setDataMessage("Interactive tutorial chapter is unavailable right now.");
        return;
      }

      if (!returnState) {
        setReturnState({
          activeTab,
          taskView,
          riskManagementView,
          worklogsView,
          reportsView,
          manufacturingView,
          inventoryView,
          selectedSeasonId,
          selectedProjectId,
        });
      }
      if (!bootstrapSnapshot) {
        setBootstrapSnapshot(structuredClone(bootstrap));
      }

      setDataMessage(null);
      try {
        if (!returnState) {
          await startInteractiveTutorialSession(handleUnauthorized);
        }
        await resetInteractiveTutorialSession(handleUnauthorized, "baseline");
      } catch (error) {
        setDataMessage(toErrorMessage(error));
        return;
      }

      let tutorialBootstrap: BootstrapPayload;
      try {
        tutorialBootstrap = await fetchBootstrap(undefined, undefined, undefined, handleUnauthorized);
      } catch (error) {
        setDataMessage(toErrorMessage(error));
        return;
      }

      startTransition(() => {
        setBootstrap(tutorialBootstrap);
      });
      setActivePersonFilter([]);

      const tutorialSeason =
        tutorialBootstrap.seasons.find((season) => season.name.toLowerCase() === "tutorial season") ??
        tutorialBootstrap.seasons.find((season) => season.id === "default-season") ??
        tutorialBootstrap.seasons[0] ??
        null;
      const projectsInTutorialSeason = tutorialSeason
        ? tutorialBootstrap.projects.filter((project) => project.seasonId === tutorialSeason.id)
        : [];
      const tutorialProject =
        projectsInTutorialSeason.find((project) => project.projectType === chapter.preferredProjectType) ??
        projectsInTutorialSeason.find((project) => project.projectType === "robot") ??
        projectsInTutorialSeason[0] ??
        tutorialBootstrap.projects.find((project) => project.projectType === chapter.preferredProjectType) ??
        tutorialBootstrap.projects.find((project) => project.projectType === "robot") ??
        tutorialBootstrap.projects[0] ??
        null;
      const tutorialSeasonId = tutorialSeason?.id ?? null;
      const tutorialProjectId = tutorialProject?.id ?? null;

      const nonTutorialSeasonId =
        tutorialBootstrap.seasons.find((season) => season.id !== tutorialSeasonId)?.id ?? null;
      const projectToForceOutreachSwitch =
        projectsInTutorialSeason.find(
          (project) => project.id !== tutorialProjectId && project.projectType === "robot",
        ) ??
        projectsInTutorialSeason.find((project) => project.id !== tutorialProjectId) ??
        null;

      if (tutorialSeasonId) {
        setSelectedSeasonId(
          chapter.id === "planning" ? nonTutorialSeasonId ?? tutorialSeasonId : tutorialSeasonId,
        );
        setTutorialSeasonId(tutorialSeasonId);
        setTutorialSeasonName(`${tutorialSeason?.name ?? "Tutorial season"} (fake sandbox)`);
      } else {
        setSelectedSeasonId(null);
        setTutorialSeasonId(null);
        setTutorialSeasonName("Tutorial season (fake sandbox)");
      }

      if (tutorialProject) {
        if (chapter.id === "planning") {
          setSelectedProjectId(null);
        } else if (chapter.id === "outreach") {
          setSelectedProjectId(projectToForceOutreachSwitch?.id ?? null);
        } else {
          setSelectedProjectId(tutorialProject.id);
        }
        setTutorialProjectId(tutorialProject.id);
        setTutorialProjectName(tutorialProject.name);
      } else {
        setSelectedProjectId(null);
        setTutorialProjectId(null);
        setTutorialProjectName(null);
      }

      setBaselineCounts(
        getInteractiveTutorialCreationCounts(tutorialBootstrap, tutorialProjectId, tutorialSeasonId),
      );
      setCompletedChapterId(null);
      setChapterId(chapter.id);
      setActiveTab("tasks");
      setTaskView("timeline");
      setRiskManagementView("kanban");
      setWorklogsView("logs");
      setReportsView("qa");
      setManufacturingView("cnc");
      setInventoryView("materials");
      setStepIndex(0);

      if (isSidebarCollapsed) {
        toggleSidebar();
      }
      closeSidebarOverlay();
    },
    [
      activeTab,
      bootstrap,
      bootstrapSnapshot,
      chapters,
      closeSidebarOverlay,
      handleUnauthorized,
      inventoryView,
      isSidebarCollapsed,
      manufacturingView,
      riskManagementView,
      returnState,
      selectedProjectId,
      selectedSeasonId,
      setActivePersonFilter,
      setActiveTab,
      setBootstrap,
      setDataMessage,
      setInventoryView,
      setManufacturingView,
      setReportsView,
      setRiskManagementView,
      setSelectedProjectId,
      setSelectedSeasonId,
      setTaskView,
      setWorklogsView,
      stepIndex,
      taskView,
      toggleSidebar,
      worklogsView,
    ],
  );

  const continueInteractiveTutorialToNextChapter = useCallback(() => {
    if (!nextChapterId) {
      void closeInteractiveTutorial();
      return;
    }

    void startInteractiveTutorial(nextChapterId);
  }, [closeInteractiveTutorial, nextChapterId, startInteractiveTutorial]);

  const stepCompletionContext = useMemo(
    () => ({
      bootstrap,
      tutorialProjectId,
      tutorialSeasonId,
      baselineCounts,
      activeTimelineTaskDetailId,
      taskModalMode,
      activeTaskId,
      materialModalMode,
      activeMaterialId,
      subsystemModalMode,
      activeSubsystemId,
      mechanismModalMode,
      activeMechanismId,
      manufacturingModalMode,
      activeManufacturingId,
      workstreamModalMode,
      activeWorkstreamId,
    }),
    [
      activeMechanismId,
      activeManufacturingId,
      activeMaterialId,
      activeSubsystemId,
      activeTaskId,
      activeTimelineTaskDetailId,
      baselineCounts,
      bootstrap,
      mechanismModalMode,
      manufacturingModalMode,
      materialModalMode,
      subsystemModalMode,
      taskModalMode,
      tutorialProjectId,
      tutorialSeasonId,
      workstreamModalMode,
      activeWorkstreamId,
    ],
  );

  const { isTargetReady, spotlightRect, stepError } = useInteractiveTutorialLifecycle({
    currentStep,
    stepCompletionContext,
    tutorialSeasonName,
    tutorialProjectName,
    onAdvance: advanceInteractiveTutorial,
    onClose: closeInteractiveTutorial,
  });

  const interactiveTutorialOverlayProps = useMemo<InteractiveTutorialOverlayProps | null>(() => {
    if (!currentStep && !completedChapterId) {
      return null;
    }

    return {
      chapterTitle: activeChapter?.title ?? "Tutorial",
      completedChapterTitle:
        chapters.find((chapter) => chapter.id === completedChapterId)?.title ?? "Tutorial chapter",
      currentStep,
      hasNextChapter: Boolean(nextChapterId),
      isCreationStep: isInteractiveTutorialCreationStep(currentStep),
      isTargetReady,
      onClose: () => {
        void closeInteractiveTutorial();
      },
      onContinue: () => {
        void continueInteractiveTutorialToNextChapter();
      },
      projectName: tutorialProjectName,
      seasonName: tutorialSeasonName,
      spotlightRect,
      stepCount: steps.length,
      stepError,
      stepNumber,
    };
  }, [
    activeChapter?.title,
    chapters,
    closeInteractiveTutorial,
    completedChapterId,
    continueInteractiveTutorialToNextChapter,
    currentStep,
    isTargetReady,
    nextChapterId,
    spotlightRect,
    stepError,
    stepNumber,
    steps.length,
    tutorialProjectName,
    tutorialSeasonName,
  ]);

  return {
    chapterStartOptions,
    continueInteractiveTutorialToNextChapter,
    isInteractiveTutorialActive,
    interactiveTutorialOverlayProps,
    startInteractiveTutorial,
  };
}
