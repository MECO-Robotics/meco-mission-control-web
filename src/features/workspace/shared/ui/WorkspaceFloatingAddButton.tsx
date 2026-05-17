import { Plus } from "lucide-react";

interface WorkspaceFloatingAddButtonProps {
  ariaLabel: string;
  onClick: () => void;
  title: string;
  tutorialTarget?: string;
}

export function WorkspaceFloatingAddButton({
  ariaLabel,
  onClick,
  title,
  tutorialTarget,
}: WorkspaceFloatingAddButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      className="primary-action queue-toolbar-action queue-toolbar-action-round workspace-floating-create-button"
      data-tutorial-target={tutorialTarget}
      onClick={onClick}
      title={title}
      type="button"
    >
      <Plus size={14} strokeWidth={2} />
    </button>
  );
}
