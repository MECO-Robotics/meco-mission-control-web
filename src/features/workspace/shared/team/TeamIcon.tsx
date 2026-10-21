import { Briefcase, Clapperboard, ClipboardList, Code2, GraduationCap, Megaphone, Target, Users, Wrench, Zap } from "lucide-react";
import type { ResponsibleGroupIcon, ResponsibleGroupRecord } from "@/types/recordsOrganization";

export const TEAM_ICONS = {
  wrench: { label: "Wrench", Glyph: Wrench },
  zap: { label: "Lightning", Glyph: Zap },
  code: { label: "Code", Glyph: Code2 },
  briefcase: { label: "Briefcase", Glyph: Briefcase },
  target: { label: "Target", Glyph: Target },
  clipboard: { label: "Clipboard", Glyph: ClipboardList },
  clapperboard: { label: "Clapperboard", Glyph: Clapperboard },
  megaphone: { label: "Megaphone", Glyph: Megaphone },
  "graduation-cap": { label: "Graduation cap", Glyph: GraduationCap },
  users: { label: "People", Glyph: Users },
} satisfies Record<ResponsibleGroupIcon, { label: string; Glyph: typeof Users }>;

export function TeamIcon({ team, size = 14 }: {
  team?: Pick<ResponsibleGroupRecord, "name" | "icon" | "color"> | null;
  size?: number;
}) {
  const Glyph = team ? TEAM_ICONS[team.icon].Glyph : Users;
  const label = `Team: ${team?.name ?? "Unavailable team"}`;
  return <span role="img" aria-label={label} title={label} style={{ display: "inline-flex", flexShrink: 0, color: team ? `color-mix(in srgb, ${team.color} 45%, var(--text-title))` : undefined }}>
    <Glyph size={size} aria-hidden="true" />
  </span>;
}
