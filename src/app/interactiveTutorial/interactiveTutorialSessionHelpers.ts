import { isMemberActiveInSeason } from "@/lib/appUtils/common";
import type { BootstrapPayload } from "@/types/bootstrap";

import type {
  InteractiveTutorialChapter,
  InteractiveTutorialChapterOption,
  InteractiveTutorialReturnState,
} from "./interactiveTutorialTypes";

export function buildInteractiveTutorialChapterStartOptions(
  chapters: InteractiveTutorialChapter[],
  completedChapters: InteractiveTutorialChapter["id"][],
) {
  return chapters.map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    summary: chapter.summary,
    completed: completedChapters.includes(chapter.id),
  })) satisfies InteractiveTutorialChapterOption[];
}

export function buildInteractiveTutorialReturnState(
  returnState: InteractiveTutorialReturnState,
) {
  return returnState;
}

export function getInteractiveTutorialChapter(
  chapters: InteractiveTutorialChapter[],
  requestedChapterId: string,
) {
  return chapters.find((candidate) => candidate.id === requestedChapterId) ?? chapters[0] ?? null;
}

export function getInteractiveTutorialNextChapterId(
  chapterOrder: InteractiveTutorialChapter["id"][],
  completedChapterId: InteractiveTutorialChapter["id"] | null,
) {
  if (!completedChapterId) {
    return null;
  }

  const index = chapterOrder.indexOf(completedChapterId);
  return index < 0 ? null : chapterOrder[index + 1] ?? null;
}

export function resolveInteractiveTutorialSandboxSelection(
  tutorialBootstrap: BootstrapPayload,
  preferredProjectType: "robot" | "outreach",
) {
  const tutorialSeason =
    tutorialBootstrap.seasons.find((season) => season.name.toLowerCase() === "tutorial season") ??
    tutorialBootstrap.seasons.find((season) => season.id === "default-season") ??
    tutorialBootstrap.seasons[0] ??
    null;
  const projectsInTutorialSeason = tutorialSeason
    ? tutorialBootstrap.projects.filter((project) => project.seasonId === tutorialSeason.id)
    : [];
  const tutorialProject =
    projectsInTutorialSeason.find((project) => project.projectType === preferredProjectType) ??
    projectsInTutorialSeason.find((project) => project.projectType === "robot") ??
    projectsInTutorialSeason[0] ??
    tutorialBootstrap.projects.find((project) => project.projectType === preferredProjectType) ??
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

  return {
    nonTutorialSeasonId,
    projectToForceOutreachSwitch,
    projectsInTutorialSeason,
    tutorialProject,
    tutorialProjectId,
    tutorialSeason,
    tutorialSeasonId,
  };
}

export function countTutorialStudents(
  payload: BootstrapPayload,
  tutorialSeasonId: string | null,
) {
  return tutorialSeasonId
    ? payload.members.filter(
        (member) => member.role === "student" && isMemberActiveInSeason(member, tutorialSeasonId),
      )
    : payload.members.filter((member) => member.role === "student");
}
