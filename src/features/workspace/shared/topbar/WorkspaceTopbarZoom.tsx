import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { WorkspaceTopbarZoomControls } from "@/features/workspace/shared/ui/WorkspaceTopbarZoomControls";

interface WorkspaceTopbarZoomProps {
  ariaLabel: string;
  canZoomIn: boolean;
  canZoomOut: boolean;
  decreaseLabel: string;
  increaseLabel: string;
  onZoomIn: () => void;
  onZoomOut: () => void;
  toolbarClassName?: string;
  value: string;
}

export function WorkspaceTopbarZoom({
  ariaLabel,
  canZoomIn,
  canZoomOut,
  decreaseLabel,
  increaseLabel,
  onZoomIn,
  onZoomOut,
  toolbarClassName,
  value,
}: WorkspaceTopbarZoomProps) {
  const controls = (
    <WorkspaceTopbarZoomControls
      ariaLabel={ariaLabel}
      canZoomIn={canZoomIn}
      canZoomOut={canZoomOut}
      decreaseLabel={decreaseLabel}
      increaseLabel={increaseLabel}
      onZoomIn={onZoomIn}
      onZoomOut={onZoomOut}
      value={value}
    />
  );

  return (
    <AppTopbarSlotPortal slot="zoom">
      {toolbarClassName ? <div className={toolbarClassName}>{controls}</div> : controls}
    </AppTopbarSlotPortal>
  );
}
