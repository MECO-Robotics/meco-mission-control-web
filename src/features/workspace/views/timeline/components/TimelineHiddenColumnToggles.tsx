import { IconEye } from "@/components/shared/Icons";

import type { buildTimelineHiddenColumnToggles } from "../model/timelineGridHeaderData";

type TimelineHiddenColumnToggle = ReturnType<typeof buildTimelineHiddenColumnToggles>[number];

interface TimelineHiddenColumnTogglesProps {
  left: number;
  toggles: TimelineHiddenColumnToggle[];
}

export function TimelineHiddenColumnToggles({
  left,
  toggles,
}: TimelineHiddenColumnTogglesProps) {
  if (toggles.length === 0) {
    return null;
  }

  return (
    <div
      className="timeline-hidden-column-toggles"
      style={{
        left: `${left}px`,
      }}
    >
      {toggles.map((toggle) => (
        <button
          key={toggle.id}
          aria-label={toggle.label}
          className="timeline-column-overlay-toggle"
          onClick={toggle.onClick}
          title={toggle.label}
          type="button"
        >
          <span aria-hidden="true" className="timeline-column-visibility-icon">
            <IconEye />
          </span>
        </button>
      ))}
    </div>
  );
}
