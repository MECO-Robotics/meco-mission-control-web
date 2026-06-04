import type { ReactNode } from "react";

import "./WorkspaceEmptyState.css";

interface WorkspaceEmptyStateProps {
  actionLabel?: string;
  children?: ReactNode;
  onAction?: () => void;
  reason: string;
  title: string;
}

export function WorkspaceEmptyState({
  actionLabel,
  children,
  onAction,
  reason,
  title,
}: WorkspaceEmptyStateProps) {
  return (
    <div className="empty-state workspace-empty-state">
      <div className="workspace-empty-state-copy">
        <strong>{title}</strong>
        <p className="section-copy">{reason}</p>
        {children}
      </div>
      {actionLabel && onAction ? (
        <button className="workspace-empty-state-action" onClick={onAction} type="button">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
