import { IconSearchMinus, IconSearchPlus } from "@/components/shared/Icons";

export function WorkspaceTopbarZoomControls({ ariaLabel, label, max, min, onChange, value }: {
  ariaLabel: string;
  label: string;
  max: number;
  min: number;
  onChange: (direction: 1 | -1) => void;
  value: number;
}) {
  return (
    <div aria-label={ariaLabel} className="workspace-topbar-zoom-controls" role="group">
      <button aria-label={"Zoom out " + label} className="icon-button workspace-topbar-zoom-button" disabled={value <= min} onClick={() => onChange(-1)} title={"Zoom out " + label} type="button">
        <IconSearchMinus />
      </button>
      <span className="workspace-topbar-zoom-label">{Math.round(value * 100)}%</span>
      <button aria-label={"Zoom in " + label} className="icon-button workspace-topbar-zoom-button" disabled={value >= max} onClick={() => onChange(1)} title={"Zoom in " + label} type="button">
        <IconSearchPlus />
      </button>
    </div>
  );
}
