import type { BootstrapPayload, MilestonePayload } from "@/types";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model";
import type { FilterSelection } from "@/features/workspace/shared/WorkspaceViewShared";

import { MilestonesToolbar } from "./MilestonesToolbar";
import { MilestonesMilestoneModal } from "./MilestonesEventModal";
import { MilestonesBoardSection } from "./sections/MilestonesBoardSection";
import { useMilestonesViewState } from "./sections/milestonesViewState";

interface MilestonesViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  onDeleteTimelineMilestone: (milestoneId: string) => Promise<void>;
  onSaveTimelineMilestone: (
    mode: "create" | "edit",
    milestoneId: string | null,
    payload: MilestonePayload,
  ) => Promise<void>;
}

export function MilestonesView({
  activePersonFilter,
  bootstrap,
  isAllProjectsView,
  onDeleteTimelineMilestone,
  onSaveTimelineMilestone,
}: MilestonesViewProps) {
  const milestones = useMilestonesViewState({
    activePersonFilter,
    bootstrap,
    isAllProjectsView,
    onDeleteTimelineMilestone,
    onSaveTimelineMilestone,
  });

  return (
    <section className={`panel dense-panel milestone-view ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Milestones</h2>
          <p className="section-copy filter-copy">
            {milestones.processedMilestones.length === 1
              ? "1 milestone matches the current filters."
              : `${milestones.processedMilestones.length} milestones match the current filters.`}
            {activePersonFilter.length > 0
              ? ` Only milestones linked to tasks assigned to or mentored by ${milestones.activePersonFilterLabel}.`
              : ""}
          </p>
        </div>
        <MilestonesToolbar
          isAllProjectsView={isAllProjectsView}
          onAddMilestone={milestones.openCreateMilestoneModal}
          projectFilter={milestones.projectFilter}
          projects={bootstrap.projects}
          searchFilter={milestones.searchFilter}
          setProjectFilter={milestones.setProjectFilter}
          setSearchFilter={milestones.setSearchFilter}
          setSortField={milestones.setSortField}
          setSortOrder={milestones.setSortOrder}
          setTypeFilter={milestones.setTypeFilter}
          sortField={milestones.sortField}
          sortOrder={milestones.sortOrder}
          typeFilter={milestones.typeFilter}
        />
      </div>

      <MilestonesBoardSection
        bootstrap={bootstrap}
        milestones={milestones.processedMilestones}
        motionClassName={milestones.milestoneFilterMotionClass}
        onOpenMilestone={milestones.openMilestoneDetailsModal}
        projectLabelByMilestoneId={milestones.projectLabelByMilestoneId}
      />

      <MilestonesMilestoneModal
        activeMilestone={milestones.activeMilestone}
        bootstrap={bootstrap}
        milestoneError={milestones.milestoneError}
        milestoneModalMode={milestones.milestoneModalMode}
        milestoneStartDate={milestones.milestoneStartDate}
        milestoneStartTime={milestones.milestoneStartTime}
        milestoneEndDate={milestones.milestoneEndDate}
        milestoneEndTime={milestones.milestoneEndTime}
        isDeletingMilestone={milestones.isDeletingMilestone}
        isSavingMilestone={milestones.isSavingMilestone}
        milestoneDraft={milestones.milestoneDraft}
        modalPortalTarget={milestones.modalPortalTarget}
        onClose={milestones.closeMilestoneModal}
        onDelete={milestones.handleMilestoneDelete}
        onEditMilestone={milestones.openEditMilestoneModal}
        onSubmit={milestones.handleMilestoneSubmit}
        projectsById={milestones.projectsById}
        setMilestoneEndDate={milestones.setMilestoneEndDate}
        setMilestoneEndTime={milestones.setMilestoneEndTime}
        setMilestoneStartDate={milestones.setMilestoneStartDate}
        setMilestoneStartTime={milestones.setMilestoneStartTime}
        setMilestoneDraft={milestones.setMilestoneDraft}
      />
    </section>
  );
}
