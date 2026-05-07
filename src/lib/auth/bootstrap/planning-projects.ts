import type { ProjectRecord, SeasonRecord } from "@/types/recordsOrganization";
import {
  classifyProjectBucket,
  getRequiredProjectTemplate,
  LEGACY_PROJECT_ID,
  LEGACY_SEASON_ID,
  REQUIRED_PROJECTS_PER_SEASON,
  reserveUniqueId,
  toSlug,
  toTitleFromId,
  type LegacyBootstrapPayload,
  type NonRobotProjectBucket,
} from "./shared";

export interface NormalizedPlanningProjects {
  seasons: SeasonRecord[];
  projects: ProjectRecord[];
  defaultSeasonId: string;
  defaultProjectId: string;
  projectIds: Set<string>;
  projectIdAliases: Map<string, string>;
}

function getTutorialSeasonName(seasonId: string) {
  return seasonId === LEGACY_SEASON_ID ? "Tutorial Season" : toTitleFromId(seasonId);
}

export function normalizePlanningProjects(
  source: LegacyBootstrapPayload,
  startDate: string,
  endDate: string,
): NormalizedPlanningProjects {
  const sourceSeasons = source.seasons ?? [];
  const sourceProjects = source.projects ?? [];

  let seasons: SeasonRecord[] = sourceSeasons;
  if (seasons.length === 0) {
    const seasonIdsFromProjects = Array.from(
      new Set(
        sourceProjects
          .map((project) => project.seasonId)
          .filter(
            (seasonId): seasonId is string =>
              typeof seasonId === "string" && seasonId.length > 0,
          ),
      ),
    );
    const seasonIds =
      seasonIdsFromProjects.length > 0 ? seasonIdsFromProjects : [LEGACY_SEASON_ID];

    seasons = seasonIds.map((seasonId) => ({
      id: seasonId,
      name: getTutorialSeasonName(seasonId),
      type: "season",
      startDate,
      endDate,
    }));
  }

  const defaultSeasonId = seasons[0]?.id ?? LEGACY_SEASON_ID;
  const usedProjectIds = new Set<string>();
  const projectIdAliases = new Map<string, string>();
  const nonRobotProjectsBySeason = new Map<string, Map<NonRobotProjectBucket, string>>();
  const projects: ProjectRecord[] = [];

  sourceProjects.forEach((project, index) => {
    const originalProjectId = project.id;
    const projectId = reserveUniqueId(
      originalProjectId ?? "",
      `project-${index + 1}`,
      usedProjectIds,
    );
    const seasonId = seasons.some((season) => season.id === project.seasonId)
      ? project.seasonId
      : defaultSeasonId;
    const projectName = project.name ?? `Project ${index + 1}`;
    const projectType = project.projectType ?? "robot";
    const bucket = classifyProjectBucket({
      name: projectName,
      projectType,
    });

    if (bucket === "robot") {
      projectIdAliases.set(projectId, projectId);
      if (originalProjectId) {
        projectIdAliases.set(originalProjectId, projectId);
      }

      projects.push({
        id: projectId,
        seasonId,
        name: projectName,
        projectType,
        description: project.description ?? "",
        status: project.status ?? "active",
      });
      return;
    }

    const canonicalBucket: NonRobotProjectBucket = bucket ?? "strategy";
    const seasonProjects =
      nonRobotProjectsBySeason.get(seasonId) ?? new Map<NonRobotProjectBucket, string>();
    nonRobotProjectsBySeason.set(seasonId, seasonProjects);

    const existingProjectId = seasonProjects.get(canonicalBucket);
    if (existingProjectId) {
      projectIdAliases.set(projectId, existingProjectId);
      if (originalProjectId) {
        projectIdAliases.set(originalProjectId, existingProjectId);
      }
      return;
    }

    const template = getRequiredProjectTemplate(canonicalBucket);
    if (!template) {
      return;
    }

    seasonProjects.set(canonicalBucket, projectId);
    projectIdAliases.set(projectId, projectId);
    if (originalProjectId) {
      projectIdAliases.set(originalProjectId, projectId);
    }

    projects.push({
      id: projectId,
      seasonId,
      name: template.name,
      projectType: template.projectType,
      description:
        project.description ?? `${template.name} scope for ${toTitleFromId(seasonId)}.`,
      status: project.status ?? "active",
    });
  });

  seasons.forEach((season) => {
    const existingBuckets = new Set(
      projects
        .filter((project) => project.seasonId === season.id)
        .map((project) => classifyProjectBucket(project))
        .filter(
          (bucket): bucket is NonNullable<ReturnType<typeof classifyProjectBucket>> =>
            bucket !== null,
        ),
    );

    REQUIRED_PROJECTS_PER_SEASON.forEach((template) => {
      if (existingBuckets.has(template.key)) {
        return;
      }

      const generatedId = reserveUniqueId(
        `${toSlug(season.id)}-${template.key}`,
        `${LEGACY_PROJECT_ID}-${template.key}`,
        usedProjectIds,
      );

      projects.push({
        id: generatedId,
        seasonId: season.id,
        name: template.name,
        projectType: template.projectType,
        description: `${template.name} scope for ${season.name}.`,
        status: "active",
      });
    });
  });

  const projectIds = new Set(projects.map((project) => project.id));
  const defaultProjectId =
    projects.find(
      (project) =>
        project.seasonId === defaultSeasonId &&
        classifyProjectBucket(project) === "robot",
    )?.id ?? projects[0]?.id ?? LEGACY_PROJECT_ID;

  return {
    seasons,
    projects,
    defaultSeasonId,
    defaultProjectId,
    projectIds,
    projectIdAliases,
  };
}
