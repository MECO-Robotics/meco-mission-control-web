import { IconSearchMinus, IconSearchPlus } from "@/components/shared/Icons";

export function WorkspaceTopbarZoomControls({ ariaLabel, canZoomIn, canZoomOut, decreaseLabel, increaseLabel, onZoomIn, onZoomOut, value }: {
  ariaLabel: string;
  canZoomIn: boolean;
  canZoomOut: boolean;
  decreaseLabel: string;
  increaseLabel: string;
  onZoomIn: () => void;
  onZoomOut: () => void;
  value: string;
}) {
  return (
    <div aria-label={ariaLabel} className="workspace-topbar-zoom-controls" role="group">
      <button aria-label={decreaseLabel} className="icon-button workspace-topbar-zoom-button" disabled={!canZoomOut} onClick={onZoomOut} title={decreaseLabel} type="button">
        <IconSearchMinus />
      </button>
      <span className="workspace-topbar-zoom-label">{value}</span>
      <button aria-label={increaseLabel} className="icon-button workspace-topbar-zoom-button" disabled={!canZoomIn} onClick={onZoomIn} title={increaseLabel} type="button">
        <IconSearchPlus />
      </button>
    </div>
  );
}
