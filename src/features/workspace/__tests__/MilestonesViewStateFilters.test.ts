/// <reference types="jest" />

import {
  buildMilestoneSearchSuggestions,
  filterAndSortMilestones,
  type MilestoneSortField,
} from "@/features/workspace/views/milestones/milestonesViewUtils";
import { createBootstrap } from "./milestoneFixture";

it("keeps search out of suggestion candidates while readiness filters both milestone lists", () => {
  const bootstrap = createBootstrap();
  const projectsById = Object.fromEntries(bootstrap.projects.map((project) => [project.id, project]));
  const sharedFilters = {
    activePersonFilter: [],
    bootstrap,
    projectsById,
    milestones: bootstrap.milestones,
    isAllProjectsView: false,
    projectFilter: [],
    sortField: "startDateTime" as MilestoneSortField,
    sortOrder: "asc" as const,
    typeFilter: [],
  };
  const filterByReadiness = (milestones: typeof bootstrap.milestones, readinessStatus: string) =>
    milestones.filter((milestone) => (milestone.readinessStatus ?? "not-ready") === readinessStatus);

  const visibleMilestones = filterByReadiness(
    filterAndSortMilestones({ ...sharedFilters, searchFilter: "Design" }),
    "blocked",
  );
  const blockedSuggestionCandidates = filterByReadiness(
    filterAndSortMilestones({ ...sharedFilters, searchFilter: "" }),
    "blocked",
  );
  const readySuggestionCandidates = filterByReadiness(
    filterAndSortMilestones({ ...sharedFilters, searchFilter: "" }),
    "ready",
  );
  const readySuggestion = buildMilestoneSearchSuggestions({
    milestones: readySuggestionCandidates,
    projectLabelByMilestoneId: {},
    searchFilter: "Regional",
  });

  expect(visibleMilestones.map(({ id }) => id)).toEqual(["milestone-2"]);
  expect(blockedSuggestionCandidates.map(({ id }) => id)).toEqual(["milestone-2"]);
  expect(readySuggestion.map(({ id }) => id)).toEqual(["milestone-1"]);
});
