import React from "react";
import type { CSSProperties, ReactNode } from "react";

import {
  IconCalendar,
  IconCheck,
  IconEdit,
  IconManufacturing,
  IconParts,
  IconRisk,
  IconTasks,
} from "@/components/shared/Icons";
import { Dumbbell, HeartHandshake, Megaphone, Paintbrush, Share2 } from "lucide-react";

import type { BootstrapPayload } from "@/types/bootstrap";

const DISCIPLINE_ICON_BY_CODE: Record<string, ReactNode> = {
  design: <IconEdit />,
  manufacturing: <IconManufacturing />,
  assembly: <IconParts />,
  electrical: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m13 2-8 10h5l-1 10 8-11h-5Z" fill="currentColor" /></svg>,
  programming: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m9 7-5 5 5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /><path d="m15 7 5 5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /><path d="M13 5 11 19" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>,
  testing: <IconCheck />,
  planning: <IconCalendar />,
  communications: <Megaphone size={14} strokeWidth={2} />,
  finance: <svg aria-hidden="true" viewBox="0 0 24 24"><text x="12" y="12" textAnchor="middle" dominantBaseline="middle" fill="currentColor" fontFamily="Inter, system-ui, sans-serif" fontSize="14" fontWeight="700">$</text></svg>,
  research: <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10" cy="10" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="m13.5 13.5 4.5 4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /><path d="M8.6 10h2.8M10 8.6v2.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" /></svg>,
  documentation: <IconTasks />,
  photography: <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12.5" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M7.5 7 9 5h6l1.5 2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>,
  video: <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="4" y="6" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="m16 10 4-2v8l-4-2Z" fill="currentColor" /><path d="M8 10.5v3l3-1.5Z" fill="currentColor" /></svg>,
  graphics: <Paintbrush size={14} strokeWidth={2} />,
  writing: <IconEdit />,
  web: <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M4.8 12h14.4M12 4.8a12 12 0 0 1 0 14.4M12 4.8a12 12 0 0 0 0 14.4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" /></svg>,
  social_media: <Share2 size={14} strokeWidth={2} />,
  engagement: <HeartHandshake size={14} strokeWidth={2} />,
  presentation: <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="10" rx="1.8" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M12 15v4M9 19h6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /><path d="M8 9h8M8 11.8h5.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" /></svg>,
  media_production: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 8h16v10H4Z" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M4 8 7 5h10l3 3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><path d="M10.4 11.2 14 13l-3.6 1.8Z" fill="currentColor" /></svg>,
  partnerships: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7.2 12.4 4.8 10a2.8 2.8 0 0 1 0-4l1-1a2.8 2.8 0 0 1 4 0l1.8 1.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><path d="M16.8 11.6 19.2 14a2.8 2.8 0 0 1 0 4l-1 1a2.8 2.8 0 0 1-4 0l-1.8-1.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><path d="M9.5 14.5 14.5 9.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /></svg>,
  game_analysis: <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="2.2" fill="currentColor" /><path d="M12 5.7v2.1M18.3 12h-2.1M12 18.3v-2.1M5.7 12h2.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" /></svg>,
  scouting: <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="7" cy="12" r="4.8" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="17" cy="12" r="4.8" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M5.6 10.3c.7-.5 1.4-.8 2.1-.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeOpacity="0.6" strokeWidth="1.2" /><path d="M15.6 10.3c.7-.5 1.4-.8 2.1-.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeOpacity="0.6" strokeWidth="1.2" /><path d="M9.8 7.9h3.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" /></svg>,
  data_analysis: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 18.5h14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /><rect x="6" y="11" width="2.6" height="5.5" rx="0.6" fill="currentColor" /><rect x="10.7" y="8.3" width="2.6" height="8.2" rx="0.6" fill="currentColor" /><rect x="15.4" y="5.5" width="2.6" height="11" rx="0.6" fill="currentColor" /></svg>,
  risk_review: <IconRisk />,
  curriculum: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 5.5h10a2 2 0 0 1 2 2v10a2 2 0 0 0-2-2H6Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" /><path d="M8 8.2h6M8 11.1h6M8 14h4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" /></svg>,
  instruction: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 4.5 5 8.5l7 4 7-4-7-4Z" fill="currentColor" /><path d="M7 11v3.5c0 1.2 2.2 2.5 5 2.5s5-1.3 5-2.5V11" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></svg>,
  practice: <Dumbbell size={14} strokeWidth={2} />,
  assessment: <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="6" y="4.8" width="12" height="14.4" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M8.5 9.2h7M8.5 12h4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" /><path d="m9 15 1.5 1.5L14.5 12.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>,
};

void React;

export function getTaskQueueDisciplineIcon(disciplineCode: string | undefined) {
  if (!disciplineCode) {
    return null;
  }

  return DISCIPLINE_ICON_BY_CODE[disciplineCode] ?? <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5.5 6 9v6l6 3.5 6-3.5V9L12 5.5Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

export function TaskDisciplineBadge({
  accentColor,
  discipline,
}: {
  accentColor: string;
  discipline: Pick<BootstrapPayload["disciplines"][number], "code" | "name">;
}) {
  const label = `${discipline.name} discipline`;

  return (
    <span
      aria-label={label}
      className="task-queue-board-card-discipline"
      role="img"
      style={
        {
          color: accentColor,
          background: `color-mix(in srgb, ${accentColor} 16%, transparent)`,
          borderColor: `color-mix(in srgb, ${accentColor} 38%, transparent)`,
        } as CSSProperties
      }
      title={label}
    >
      {getTaskQueueDisciplineIcon(discipline.code)}
    </span>
  );
}
