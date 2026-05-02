import { Suspense } from "react";

import type { AppWorkspaceController } from "@/app/hooks/useAppWorkspaceController";
import { AppWorkspaceShellContent } from "./AppWorkspaceShellContent";
import { AppWorkspaceShellModalLayer } from "./AppWorkspaceShellModalLayer";
import { AppWorkspaceShellOverlayLayer } from "./AppWorkspaceShellOverlayLayer";
import { AppWorkspaceShellSidebar } from "./AppWorkspaceShellSidebar";
import { AppWorkspaceShellTopbar } from "./AppWorkspaceShellTopbar";
import { WorkspaceShellLoading } from "./workspaceShell";

export function AppWorkspaceShellView({ controller }: { controller: AppWorkspaceController }) {
  const c = controller;

  return (
    <main
      className={`page-shell ${c.isDarkMode ? "dark-mode" : ""} ${c.isSidebarCollapsed ? "is-sidebar-collapsed" : ""} ${c.isSidebarOverlay ? "is-sidebar-overlay" : ""}`}
      style={c.pageShellStyle}
    >
      <Suspense fallback={<WorkspaceShellLoading />}>
        <AppWorkspaceShellTopbar controller={c} />
        <AppWorkspaceShellSidebar controller={c} />
        <AppWorkspaceShellOverlayLayer controller={c} />
        <AppWorkspaceShellContent controller={c} />
      </Suspense>

      <AppWorkspaceShellModalLayer controller={c} />
    </main>
  );
}
