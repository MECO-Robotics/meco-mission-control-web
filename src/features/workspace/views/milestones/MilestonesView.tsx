import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestonePayload } from "@/types/payloads";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";

import { MilestonesToolbar } from "./MilestonesToolbar";
import { MilestonesMilestoneModal } from "./MilestonesEventModal";
import { MilestonesBoardSection } from "./sections/MilestonesBoardSection";
import { useMilestonesViewState } from "./sections/milestonesViewState";

interface MilestonesViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  onTaskEditCanceled?: () => void;
  onTaskEditSaved?: () => void;
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
  onTaskEditCanceled = () => {},
  onTaskEditSaved = () => {},
  onDeleteTimelineMilestone,
  onSaveTimelineMilestone,
}: MilestonesViewProps) {
  const milestones = useMilestonesViewState({
    activePersonFilter,
    bootstrap,
    isAllProjectsView,
    onTaskEditCanceled,
    onTaskEditSaved,
    onDeleteTimelineMilestone,
    onSaveTimelineMilestone,
  });

  return (
    <section
      className={`panel dense-panel milestone-view ${WORKSPACE_PANEL_CLASS}`}
      style={{
        display: "flex",
        flex: "1 1 auto",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Milestones</h2>
        </div>
        <MilestonesToolbar
          isAllProjectsView={isAllProjectsView}
          onAddMilestone={milestones.openCreateMilestoneModal}
          milestoneZoom={milestones.milestoneZoom}
          projectFilter={milestones.projectFilter}
          projects={bootstrap.projects}
          searchFilter={milestones.searchFilter}
          setMilestoneZoom={milestones.setMilestoneZoom}
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
        milestoneZoom={milestones.milestoneZoom}
        onOpenMilestone={milestones.openMilestoneDetailsModal}
        projectLabelByMilestoneId={milestones.projectLabelByMilestoneId}
        setMilestoneZoom={milestones.setMilestoneZoom}
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
        onCancelEdit={milestones.cancelMilestoneEdit}
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
