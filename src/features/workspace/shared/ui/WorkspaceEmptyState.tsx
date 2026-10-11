import type { ReactNode } from "react";

import "./WorkspaceEmptyState.css";

interface WorkspaceEmptyStateProps {
  children?: ReactNode;
  reason: string;
  title: string;
}

export function WorkspaceEmptyState({
  children,
  reason,
  title,
}: WorkspaceEmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="workspace-empty-state-copy">
        <strong>{title}</strong>
        <p className="section-copy">{reason}</p>
        {children}
      </div>
    </div>
  );
}
