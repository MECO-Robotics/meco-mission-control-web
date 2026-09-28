import { IconSearchMinus, IconSearchPlus } from "@/components/shared/Icons";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";

interface WorkspaceTopbarZoomProps {
  ariaLabel: string;
  canZoomIn: boolean;
  canZoomOut: boolean;
  className: string;
  decreaseLabel: string;
  increaseLabel: string;
  buttonClassName: string;
  labelClassName: string;
  onZoomIn: () => void;
  onZoomOut: () => void;
  toolbarClassName?: string;
  value: string;
}

export function WorkspaceTopbarZoom({
  ariaLabel,
  canZoomIn,
  canZoomOut,
  className,
  decreaseLabel,
  increaseLabel,
  buttonClassName,
  labelClassName,
  onZoomIn,
  onZoomOut,
  toolbarClassName,
  value,
}: WorkspaceTopbarZoomProps) {
  const controls = (
    <div aria-label={ariaLabel} className={className} role="group">
      <button
        aria-label={decreaseLabel}
        className={`icon-button ${buttonClassName}`}
        disabled={!canZoomOut}
        onClick={onZoomOut}
        title={decreaseLabel}
        type="button"
      >
        <IconSearchMinus />
      </button>
      <span className={labelClassName}>{value}</span>
      <button
        aria-label={increaseLabel}
        className={`icon-button ${buttonClassName}`}
        disabled={!canZoomIn}
        onClick={onZoomIn}
        title={increaseLabel}
        type="button"
      >
        <IconSearchPlus />
      </button>
    </div>
  );

  return (
    <AppTopbarSlotPortal slot="zoom">
      {toolbarClassName ? <div className={toolbarClassName}>{controls}</div> : controls}
    </AppTopbarSlotPortal>
  );
}
