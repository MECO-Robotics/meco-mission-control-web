import { Suspense } from "react";

import type { AppWorkspaceShellController } from "@/app/hooks/useAppWorkspaceController";
import { AppWorkspaceShellContent } from "./AppWorkspaceShellContent";
import { AppWorkspaceShellModalLayer } from "./AppWorkspaceShellModalLayer";
import { AppWorkspaceShellOverlayLayer } from "./AppWorkspaceShellOverlayLayer";
import { AppWorkspaceShellSidebar } from "./AppWorkspaceShellSidebar";
import { AppWorkspaceShellTopbar } from "./AppWorkspaceShellTopbar";
import { WorkspaceShellLoading } from "./workspaceShell";

export function AppWorkspaceShellView({ controller }: { controller: AppWorkspaceShellController }) {
  const c = controller;

  return (
    <main
      className={`page-shell ${c.frame.isDarkMode ? "dark-mode" : ""} ${c.frame.isSidebarCollapsed ? "is-sidebar-collapsed" : ""} ${c.frame.isSidebarOverlay ? "is-sidebar-overlay" : ""}`}
      style={c.frame.pageShellStyle}
    >
      <Suspense fallback={<WorkspaceShellLoading />}>
        <AppWorkspaceShellTopbar controller={c.topbar} />
        <AppWorkspaceShellSidebar controller={c.sidebar} />
        <AppWorkspaceShellOverlayLayer controller={c.overlayLayer} />
        <AppWorkspaceShellContent controller={c.content} />
      </Suspense>

      <AppWorkspaceShellModalLayer controller={c.modalLayer} />
    </main>
  );
}
