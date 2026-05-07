import type { ReactNode } from "react";

import type { AppWorkspaceShellOverlayLayerController } from "@/app/hooks/useAppWorkspaceController";

function ModalScrim({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div
      className="modal-scrim"
      onClick={(milestone) => {
        if (milestone.target === milestone.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      {children}
    </div>
  );
}

export function AddSeasonPopup({
  controller,
}: {
  controller: AppWorkspaceShellOverlayLayerController;
}) {
  const c = controller;

  return (
    <ModalScrim onClose={c.closeCreateSeasonPopup}>
      <section aria-modal="true" className="modal-card roster-edit-modal" role="dialog">
        <div className="panel-header compact-header">
          <div className="queue-section-header">
            <h3>Add season</h3>
            <p className="section-copy">Create a new season and switch the workspace to it.</p>
          </div>
          <button className="icon-button" onClick={c.closeCreateSeasonPopup} type="button">
            Close
          </button>
        </div>
        <form className="modal-form" onSubmit={c.handleCreateSeasonSubmit}>
          <label className="field modal-wide">
            <span>Name</span>
            <input
              autoFocus
              minLength={2}
              onChange={(milestone) => c.setSeasonNameDraft(milestone.target.value)}
              placeholder="2027 Season"
              required
              value={c.seasonNameDraft}
            />
          </label>
          <div className="modal-actions modal-wide">
            <button className="secondary-action" onClick={c.closeCreateSeasonPopup} type="button">
              Cancel
            </button>
            <button className="primary-action" disabled={c.isSavingSeason} type="submit">
              {c.isSavingSeason ? "Saving..." : "Add season"}
            </button>
          </div>
        </form>
      </section>
    </ModalScrim>
  );
}

export function RobotProjectPopup({
  controller,
}: {
  controller: AppWorkspaceShellOverlayLayerController;
}) {
  const c = controller;

  return (
    <ModalScrim onClose={c.closeRobotProjectPopup}>
      <section aria-modal="true" className="modal-card roster-edit-modal" role="dialog">
        <div className="panel-header compact-header">
          <div className="queue-section-header">
            <h3>{c.robotProjectModalMode === "create" ? "Add robot" : "Edit robot name"}</h3>
          </div>
          <button className="icon-button" onClick={c.closeRobotProjectPopup} type="button">
            Close
          </button>
        </div>
        <form className="modal-form" onSubmit={c.handleRobotProjectSubmit}>
          <label className="field modal-wide">
            <span>Name</span>
            <input
              autoFocus
              minLength={2}
              onChange={(milestone) => c.setRobotProjectNameDraft(milestone.target.value)}
              placeholder="Practice Bot"
              required
              value={c.robotProjectNameDraft}
            />
          </label>
          <div className="modal-actions modal-wide">
            <button className="secondary-action" onClick={c.closeRobotProjectPopup} type="button">
              Cancel
            </button>
            <button className="primary-action" disabled={c.isSavingRobotProject} type="submit">
              {c.isSavingRobotProject
                ? "Saving..."
                : c.robotProjectModalMode === "create"
                  ? "Add robot"
                  : "Save name"}
            </button>
          </div>
        </form>
      </section>
    </ModalScrim>
  );
}

export function SidebarOverlay({
  controller,
}: {
  controller: AppWorkspaceShellOverlayLayerController;
}) {
  const c = controller;

  if (!c.isSidebarOverlay) {
    return null;
  }

  return (
    <>
      <button
        aria-label="Close sidebar"
        className="sidebar-overlay-scrim"
        onClick={c.closeSidebarOverlay}
        type="button"
      />
      <button
        aria-hidden="true"
        className="sidebar-overlay-topbar-scrim"
        onClick={c.closeSidebarOverlay}
        tabIndex={-1}
        type="button"
      />
    </>
  );
}
