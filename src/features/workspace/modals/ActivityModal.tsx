import { useEffect } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import { useWorkLogsViewState } from "../views/workLogs/workLogsViewState";
import { WorkLogsActivitySection } from "../views/workLogs/WorkLogsActivitySection";
import { WorkLogsActivityToolbar } from "../views/workLogs/WorkLogsActivityToolbar";

interface ActivityModalProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  membersById: MembersById;
  openEditTaskModal: (task: TaskRecord) => void;
  onClose: () => void;
  subsystemsById: SubsystemsById;
}

export function ActivityModal({ activePersonFilter, bootstrap, membersById, openEditTaskModal, onClose, subsystemsById }: ActivityModalProps) {
  const state = useWorkLogsViewState({ activePersonFilter, bootstrap, membersById, subsystemsById });
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);
  return <div className="workspace-modal-backdrop activity-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section aria-labelledby="activity-modal-title" aria-modal="true" className="workspace-modal activity-modal" role="dialog">
      <header className="workspace-modal-header"><div><span className="eyebrow">Workspace history</span><h2 id="activity-modal-title">Activity</h2></div><button aria-label="Close activity" className="modal-close-button" onClick={onClose} type="button">×</button></header>
      <div className="activity-modal-toolbar"><WorkLogsActivityToolbar activityGroupMode={state.activityGroupMode} search={state.search} setActivityGroupMode={state.setActivityGroupMode} setSearch={state.setSearch} /></div>
      <WorkLogsActivitySection actions={state.activityActions} activityGroupMode={state.activityGroupMode} activityPagination={state.activityPagination} description="Changes across the current workspace." membersById={membersById} openEditTaskModal={openEditTaskModal} subsystemsById={subsystemsById} taskById={state.taskById} />
    </section>
  </div>;
}
