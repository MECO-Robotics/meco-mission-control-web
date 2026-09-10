import { useEffect, useRef, useState } from "react";
import type { MilestoneRecord } from "@/types/recordsExecution";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestonePayload } from "@/types/payloads";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { WorkspaceTopbarControls, buildSingleAddMenuAction } from "@/features/workspace/shared/topbar";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";

import { MilestonesToolbar } from "./MilestonesToolbar";
import { MilestonesMilestoneModal } from "./MilestonesEventModal";
import { MilestonesAgendaList } from "./MilestonesAgendaList";
import { useMilestonesViewState } from "./sections/milestonesViewState";

interface MilestonesViewProps {
  onCreateMilestoneReport?: (milestoneId: string, onReturn?: () => void) => void;
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
  onCreateMilestoneReport,
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

  const [requestedMilestoneId, setRequestedMilestoneId] = useState(() => typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("milestone"));
  const handledMilestoneId = useRef<string | null | undefined>(undefined);
  const modalActions = useRef(milestones);
  useEffect(() => { modalActions.current = milestones; });
  useEffect(() => {
    const restore = () => setRequestedMilestoneId(new URLSearchParams(window.location.search).get("milestone"));
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  useEffect(() => {
    if (handledMilestoneId.current === requestedMilestoneId) return;
    handledMilestoneId.current = requestedMilestoneId;
    const milestone = bootstrap.milestones.find((item) => item.id === requestedMilestoneId);
    if (milestone) modalActions.current.openMilestoneDetailsModal(milestone);
    else modalActions.current.closeMilestoneModal();
  }, [bootstrap.milestones, requestedMilestoneId]);
  const updateMilestoneLocation = (id: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (id) params.set("milestone", id); else params.delete("milestone");
    window.history.pushState(window.history.state, "", `${window.location.pathname}?${params.toString()}${window.location.hash}`);
    handledMilestoneId.current = id;
    setRequestedMilestoneId(id);
  };
  const openMilestone = (milestone: MilestoneRecord) => {
    updateMilestoneLocation(milestone.id);
    milestones.openMilestoneDetailsModal(milestone);
  };
  const closeMilestone = () => {
    if (requestedMilestoneId) updateMilestoneLocation(null);
    milestones.closeMilestoneModal();
  };

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
      <AppTopbarSlotPortal slot="controls">
        <WorkspaceTopbarControls className="milestones-toolbar">
          <MilestonesToolbar
            isAllProjectsView={isAllProjectsView}
            readinessFilter={milestones.readinessFilter}
            projectFilter={milestones.projectFilter}
            projects={bootstrap.projects}
            searchFilter={milestones.searchFilter}
            searchSuggestions={milestones.searchSuggestions}
            setReadinessFilter={milestones.setReadinessFilter}
            setProjectFilter={milestones.setProjectFilter}
            setSearchFilter={milestones.setSearchFilter}
            setSortField={milestones.setSortField}
            setSortOrder={milestones.setSortOrder}
            setTypeFilter={milestones.setTypeFilter}
            sortField={milestones.sortField}
            sortOrder={milestones.sortOrder}
            typeFilter={milestones.typeFilter}
          />
          <WorkspaceTopbarAddMenu
            actions={buildSingleAddMenuAction({
              label: "Add milestone",
              onSelect: milestones.openCreateMilestoneModal,
            })}
            ariaLabel="Add milestone"
            title="Add milestone"
            tutorialTarget="create-milestone-button"
          />
        </WorkspaceTopbarControls>
      </AppTopbarSlotPortal>

      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Milestone agenda</h2>
        </div>
      </div>

      <MilestonesAgendaList
        milestones={milestones.processedMilestones}
        onOpenMilestone={openMilestone}
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
        onClose={closeMilestone}
        onRecordResult={onCreateMilestoneReport ? (milestone) => { milestones.closeMilestoneModal(); onCreateMilestoneReport(milestone.id, () => milestones.openMilestoneDetailsModal(milestone)); } : undefined}
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
