import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestonePayload } from "@/types/payloads";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { useFilterChangeMotionClass } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import {
  buildMilestoneProjectLabels,
  buildMilestoneSearchSuggestions,
  filterAndSortMilestones,
  type MilestoneSearchSuggestion,
  type MilestoneSortField,
} from "../milestonesViewUtils";
import {
  type MilestonesMilestoneModalState,
  useMilestonesMilestoneModalState,
} from "./useMilestonesEventModalState";

export type MilestonesViewState = MilestonesMilestoneModalState & {
  milestoneFilterMotionClass: string;
  milestoneZoom: number;
  processedMilestones: BootstrapPayload["milestones"];
  projectFilter: FilterSelection;
  projectLabelByMilestoneId: Record<string, string>;
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
  searchFilter: string;
  searchSuggestions: MilestoneSearchSuggestion[];
  setProjectFilter: Dispatch<SetStateAction<FilterSelection>>;
  setSearchFilter: Dispatch<SetStateAction<string>>;
  setSortField: Dispatch<SetStateAction<MilestoneSortField>>;
  setSortOrder: Dispatch<SetStateAction<"asc" | "desc">>;
  setMilestoneZoom: Dispatch<SetStateAction<number>>;
  setTypeFilter: Dispatch<SetStateAction<FilterSelection>>;
  sortField: MilestoneSortField;
  sortOrder: "asc" | "desc";
  typeFilter: FilterSelection;
};

type MilestonesViewStateArgs = {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  onTaskEditCanceled: () => void;
  onTaskEditSaved: () => void;
  onDeleteTimelineMilestone: (milestoneId: string) => Promise<void>;
  onSaveTimelineMilestone: (
    mode: "create" | "edit",
    milestoneId: string | null,
    payload: MilestonePayload,
  ) => Promise<void>;
};

export function useMilestonesViewState({
  activePersonFilter,
  bootstrap,
  isAllProjectsView,
  onTaskEditCanceled,
  onTaskEditSaved,
  onDeleteTimelineMilestone,
  onSaveTimelineMilestone,
}: MilestonesViewStateArgs): MilestonesViewState {
  const [sortField, setSortField] = useState<MilestoneSortField>("startDateTime");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [projectFilter, setProjectFilter] = useState<FilterSelection>([]);
  const [typeFilter, setTypeFilter] = useState<FilterSelection>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [milestoneZoom, setMilestoneZoom] = useState(1);

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
  const projectLabelByMilestoneId = useMemo(
    () => buildMilestoneProjectLabels(bootstrap.milestones, projectsById, scopedProjectIds),
    [bootstrap.milestones, projectsById, scopedProjectIds],
  );
  const processedMilestones = useMemo(
    () =>
      filterAndSortMilestones({
        activePersonFilter,
        bootstrap,
        projectsById,
        milestones: bootstrap.milestones,
        isAllProjectsView,
        projectFilter,
        searchFilter,
        sortField,
        sortOrder,
        typeFilter,
      }),
    [
      activePersonFilter,
      bootstrap,
      projectsById,
      isAllProjectsView,
      projectFilter,
      searchFilter,
      sortField,
      sortOrder,
      typeFilter,
    ],
  );
  const suggestionSourceMilestones = useMemo(
    () =>
      filterAndSortMilestones({
        activePersonFilter,
        bootstrap,
        projectsById,
        milestones: bootstrap.milestones,
        isAllProjectsView,
        projectFilter,
        searchFilter: "",
        sortField,
        sortOrder,
        typeFilter,
      }),
    [
      activePersonFilter,
      bootstrap,
      projectsById,
      isAllProjectsView,
      projectFilter,
      sortField,
      sortOrder,
      typeFilter,
    ],
  );
  const searchSuggestions = useMemo(
    () =>
      buildMilestoneSearchSuggestions({
        milestones: suggestionSourceMilestones,
        projectLabelByMilestoneId,
        searchFilter,
      }),
    [projectLabelByMilestoneId, searchFilter, suggestionSourceMilestones],
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
  const modalState = useMilestonesMilestoneModalState({
    bootstrap,
    isAllProjectsView,
    onTaskEditCanceled,
    onTaskEditSaved,
    onDeleteTimelineMilestone,
    onSaveTimelineMilestone,
    projectFilter,
    scopedProjectIds,
  });

  return {
    ...modalState,
    milestoneFilterMotionClass,
    processedMilestones,
    projectFilter,
    projectLabelByMilestoneId,
    projectsById,
    searchFilter,
    searchSuggestions,
    setProjectFilter,
    setSearchFilter,
    setSortField,
    setSortOrder,
    setMilestoneZoom,
    setTypeFilter,
    sortField,
    sortOrder,
    milestoneZoom,
    typeFilter,
  };
}
