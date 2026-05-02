// @ts-nocheck
import { useMemo } from "react";

import { findMemberForSessionUser } from "@/lib/appUtils";
import { scopeBootstrapBySelection } from "@/app/state/workspaceStateUtils";
import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";

export function useAppWorkspaceDerivedSelection(state: AppWorkspaceState) {
  const { bootstrap, selectedProjectId, selectedSeasonId, sessionUser } = state;

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

  return {
    isAllProjectsView,
    isNonRobotProject,
    projectsInSelectedSeason,
    scopedArtifacts,
    scopedBootstrap,
    selectedProject,
    selectedProjectType,
    signedInMember,
    subsystemsLabel,
  };
}

export type AppWorkspaceDerivedSelection = ReturnType<
  typeof useAppWorkspaceDerivedSelection
>;
