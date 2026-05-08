import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from "react";

import { INTERACTIVE_TUTORIAL_CHAPTERS } from "@/app/interactiveTutorialData";
import { buildInteractiveTutorialChapterStartOptions, getInteractiveTutorialNextChapterId } from "../interactiveTutorialSessionHelpers";
import type {
  InteractiveTutorialChapter,
  InteractiveTutorialChapterOption,
  InteractiveTutorialCreationCounts,
  InteractiveTutorialReturnState,
  InteractiveTutorialStep,
} from "../interactiveTutorialTypes";
import type { BootstrapPayload } from "@/types/bootstrap";

export interface InteractiveTutorialCoreState {
  chapterId: InteractiveTutorialChapter["id"] | null;
  setChapterId: Dispatch<SetStateAction<InteractiveTutorialChapter["id"] | null>>;
  completedChapterId: InteractiveTutorialChapter["id"] | null;
  setCompletedChapterId: Dispatch<SetStateAction<InteractiveTutorialChapter["id"] | null>>;
  completedChapters: InteractiveTutorialChapter["id"][];
  setCompletedChapters: Dispatch<SetStateAction<InteractiveTutorialChapter["id"][]>>;
  stepIndex: number | null;
  setStepIndex: Dispatch<SetStateAction<number | null>>;
  returnState: InteractiveTutorialReturnState | null;
  setReturnState: Dispatch<SetStateAction<InteractiveTutorialReturnState | null>>;
  tutorialSeasonName: string | null;
  setTutorialSeasonName: Dispatch<SetStateAction<string | null>>;
  tutorialSeasonId: string | null;
  setTutorialSeasonId: Dispatch<SetStateAction<string | null>>;
  tutorialProjectId: string | null;
  setTutorialProjectId: Dispatch<SetStateAction<string | null>>;
  tutorialProjectName: string | null;
  setTutorialProjectName: Dispatch<SetStateAction<string | null>>;
  bootstrapSnapshot: BootstrapPayload | null;
  setBootstrapSnapshot: Dispatch<SetStateAction<BootstrapPayload | null>>;
  baselineCounts: InteractiveTutorialCreationCounts | null;
  setBaselineCounts: Dispatch<SetStateAction<InteractiveTutorialCreationCounts | null>>;
  chapters: InteractiveTutorialChapter[];
  chapterOrder: InteractiveTutorialChapter["id"][];
  activeChapter: InteractiveTutorialChapter | null;
  steps: InteractiveTutorialStep[];
  currentStep: InteractiveTutorialStep | null;
  stepNumber: number;
  isInteractiveTutorialActive: boolean;
  nextChapterId: InteractiveTutorialChapter["id"] | null;
  chapterStartOptions: InteractiveTutorialChapterOption[];
  resetLocalTutorialState: () => void;
}

export function useInteractiveTutorialCoreState() {
  const [chapterId, setChapterId] = useState<InteractiveTutorialChapter["id"] | null>(null);
  const [completedChapterId, setCompletedChapterId] = useState<InteractiveTutorialChapter["id"] | null>(null);
  const [completedChapters, setCompletedChapters] = useState<InteractiveTutorialChapter["id"][]>([]);
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
    () => (chapterId ? chapters.find((chapter) => chapter.id === chapterId) ?? null : null),
    [chapterId, chapters],
  );
  const steps = activeChapter?.steps ?? [];
  const currentStep = stepIndex !== null ? steps[stepIndex] ?? null : null;
  const stepNumber = stepIndex !== null ? stepIndex + 1 : 0;
  const isInteractiveTutorialActive = chapterId !== null || completedChapterId !== null;
  const nextChapterId = useMemo(
    () => getInteractiveTutorialNextChapterId(chapterOrder, completedChapterId),
    [chapterOrder, completedChapterId],
  );
  const chapterStartOptions = useMemo(
    () => buildInteractiveTutorialChapterStartOptions(chapters, completedChapters),
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

  return {
    activeChapter,
    baselineCounts,
    bootstrapSnapshot,
    chapterId,
    chapterOrder,
    chapterStartOptions,
    chapters,
    completedChapterId,
    completedChapters,
    currentStep,
    isInteractiveTutorialActive,
    nextChapterId,
    resetLocalTutorialState,
    returnState,
    setBaselineCounts,
    setBootstrapSnapshot,
    setChapterId,
    setCompletedChapterId,
    setCompletedChapters,
    setReturnState,
    setStepIndex,
    setTutorialProjectId,
    setTutorialProjectName,
    setTutorialSeasonId,
    setTutorialSeasonName,
    stepIndex,
    stepNumber,
    steps,
    tutorialProjectId,
    tutorialProjectName,
    tutorialSeasonId,
    tutorialSeasonName,
  };
}
