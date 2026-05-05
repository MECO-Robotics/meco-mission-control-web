import { lazy } from "react";

export const AppTopbar = lazy(() =>
  import("@/components/layout/AppTopbar").then((module) => ({
    default: module.AppTopbar,
  })),
);

export const AppSidebar = lazy(() =>
  import("@/components/layout/AppSidebar").then((module) => ({
    default: module.AppSidebar,
  })),
);

export const WorkspaceContent = lazy(() =>
  import("@/features/workspace/WorkspaceContent").then((module) => ({
    default: module.WorkspaceContent,
  })),
);

// Keep modal host lazily loaded from its component module to avoid re-export indirection.
export const WorkspaceModalHost = lazy(() =>
  import("@/features/workspace/components/WorkspaceModalHostView").then((module) => ({
    default: module.WorkspaceModalHost,
  })),
);

export function WorkspaceShellLoading() {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className="workspace-shell-loading"
      role="status"
    >
      <p className="eyebrow">MECO Mission Control</p>
      <p className="workspace-shell-loading-copy">Loading workspace modules...</p>
    </section>
  );
}
