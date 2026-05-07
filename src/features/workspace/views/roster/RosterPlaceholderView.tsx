import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";

import type { RosterViewTab } from "@/lib/workspaceNavigation";

const PLACEHOLDER_COPY: Record<
  Exclude<RosterViewTab, "directory">,
  { title: string; bullets: readonly string[] }
> = {
  workload: {
    title: "Workload placeholder",
    bullets: [
      "Member capacity and assignment balance",
      "Over-allocation alerts",
      "Unassigned task spotlight",
    ],
  },
  attendance: {
    title: "Attendance placeholder",
    bullets: [
      "Session attendance log",
      "Trends by member and role",
      "Follow-up flags for gaps",
    ],
  },
};

interface RosterPlaceholderViewProps {
  view: Exclude<RosterViewTab, "directory">;
}

export function RosterPlaceholderView({ view }: RosterPlaceholderViewProps) {
  const placeholder = PLACEHOLDER_COPY[view];

  return (
    <section className={`panel dense-panel roster-layout ${WORKSPACE_PANEL_CLASS}`}>
      <div className="empty-state roster-placeholder-state">
        <strong>{placeholder.title}</strong>
        <ul className="roster-placeholder-list">
          {placeholder.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
