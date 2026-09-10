import type { CadSourceIndicatorModel } from "./cadSourceIndicator";

interface CadSourceBadgeProps {
  source: CadSourceIndicatorModel;
}

export function CadSourceBadge({ source }: CadSourceBadgeProps) {
  return (
    <span className="robot-config-cad-source" data-source={source.tone} title={source.detail}>
      {source.label}
    </span>
  );
}
