import type { AppWorkspaceController } from "@/app/hooks/useAppWorkspaceController";

import { AddSeasonPopup, RobotProjectPopup, SidebarOverlay } from "./AppWorkspaceShellOverlays";

export function AppWorkspaceShellOverlayLayer({ controller }: { controller: AppWorkspaceController }) {
  const c = controller;

  return (
    <>
      {c.isAddSeasonPopupOpen ? <AddSeasonPopup controller={c} /> : null}
      {c.robotProjectModalMode ? <RobotProjectPopup controller={c} /> : null}
      <SidebarOverlay controller={c} />
    </>
  );
}
