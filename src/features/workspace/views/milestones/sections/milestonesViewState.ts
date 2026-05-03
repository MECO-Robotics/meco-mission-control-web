import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";

import type { BootstrapPayload, MilestonePayload } from "@/types";
import {
  formatFilterSelectionLabel,
  type FilterSelection,
  useFilterChangeMotionClass,
} from "@/features/workspace/shared/WorkspaceViewShared";
import { getMilestoneSubsystemOptions } from "@/features/workspace/shared/events/eventProjectUtils";
import {
  buildMilestoneProjectLabels,
  filterAndSortMilestones,
  type MilestoneSortField,
} from "../milestonesViewUtils";
import {
  type MilestonesMilestoneModalState,
  useMilestonesMilestoneModalState,
} from "./useMilestonesEventModalState";

export type MilestonesViewState = MilestonesMilestoneModalState & {
  activePersonFilterLabel: string;
  milestoneFilterMotionClass: string;
  processedMilestones: BootstrapPayload["milestones"];
  projectFilter: FilterSelection;
  projectLabelByMilestoneId: Record<string, string>;
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
  searchFilter: string;
  selectableSubsystems: BootstrapPayload["subsystems"];
  setProjectFilter: Dispatch<SetStateAction<FilterSelection>>;
  setSearchFilter: Dispatch<SetStateAction<string>>;
  setSortField: Dispatch<SetStateAction<MilestoneSortField>>;
  setSortOrder: Dispatch<SetStateAction<"asc" | "desc">>;
  setTypeFilter: Dispatch<SetStateAction<FilterSelection>>;
  sortField: MilestoneSortField;
  sortOrder: "asc" | "desc";
  typeFilter: FilterSelection;
};

type MilestonesViewStateArgs = {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  onDeleteTimelineMilestone: (milestoneId: string) => Promise<void>;
  onSaveTimelineMilestone: (
    mode: "create" | "edit",
    milestoneId: string | null,
    payload: MilestonePayload,
  ) => Promise<void>;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
};

export function useMilestonesViewState({
  activePersonFilter,
  bootstrap,
  isAllProjectsView,
  onDeleteTimelineMilestone,
  onSaveTimelineMilestone,
  subsystemsById,
}: MilestonesViewStateArgs): MilestonesViewState {
  const [sortField, setSortField] = useState<MilestoneSortField>("startDateTime");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [projectFilter, setProjectFilter] = useState<FilterSelection>([]);
  const [typeFilter, setTypeFilter] = useState<FilterSelection>([]);
  const [searchFilter, setSearchFilter] = useState("");

  useEffect(() => {
    if (!isAllProjectsView && projectFilter.length > 0) {
      setProjectFilter([]);
    }
  }, [isAllProjectsView, projectFilter]);

  useEffect(() => {
    const projectIds = new Set(bootstrap.projects.map((project) => project.id));
    if (projectFilter.some((projectId) => !projectIds.has(projectId))) {
      setProjectFilter((current) => current.filter((projectId) => projectIds.has(projectId)));
    }
  }, [bootstrap.projects, projectFilter]);

  const projectsById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.projects.map((project) => [project.id, project]),
      ) as Record<string, BootstrapPayload["projects"][number]>,
    [bootstrap.projects],
  );
  const scopedProjectIds = useMemo(() => bootstrap.projects.map((project) => project.id), [bootstrap.projects]);
  const processedMilestones = useMemo(
    () =>
      filterAndSortMilestones({
        activePersonFilter,
        milestones: bootstrap.milestones,
        isAllProjectsView,
        projectFilter,
        searchFilter,
        sortField,
        sortOrder,
        tasks: bootstrap.tasks,
        subsystemsById,
        typeFilter,
      }),
    [
      activePersonFilter,
      bootstrap.milestones,
      bootstrap.tasks,
      isAllProjectsView,
      projectFilter,
      searchFilter,
      sortField,
      sortOrder,
      subsystemsById,
      typeFilter,
    ],
  );
  const projectLabelByMilestoneId = useMemo(
    () => buildMilestoneProjectLabels(bootstrap.milestones, projectsById, scopedProjectIds, subsystemsById),
    [bootstrap.milestones, projectsById, scopedProjectIds, subsystemsById],
  );
  const milestoneFilterMotionClass = useFilterChangeMotionClass([
    activePersonFilter,
    isAllProjectsView,
    projectFilter,
    searchFilter,
    sortField,
    sortOrder,
    typeFilter,
  ]);
  const activePersonFilterLabel = formatFilterSelectionLabel(
    "All roster",
    bootstrap.members,
    activePersonFilter,
  );

  const modalState = useMilestonesMilestoneModalState({
    bootstrap,
    isAllProjectsView,
    onDeleteTimelineMilestone,
    onSaveTimelineMilestone,
    projectFilter,
    scopedProjectIds,
    subsystemsById,
  });
  const selectableSubsystems = useMemo(
    () => getMilestoneSubsystemOptions(bootstrap.subsystems, modalState.milestoneDraft.projectIds),
    [bootstrap.subsystems, modalState.milestoneDraft.projectIds],
  );

  return {
    ...modalState,
    activePersonFilterLabel,
    milestoneFilterMotionClass,
    processedMilestones,
    projectFilter,
    projectLabelByMilestoneId,
    projectsById,
    searchFilter,
    selectableSubsystems,
    setProjectFilter,
    setSearchFilter,
    setSortField,
    setSortOrder,
    setTypeFilter,
    sortField,
    sortOrder,
    typeFilter,
  };
}
