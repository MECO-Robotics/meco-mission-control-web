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

import type { BootstrapPayload } from "@/types";

const DISCIPLINE_ICON_BY_CODE: Record<string, ReactNode> = {
  design: <IconEdit />,
  manufacturing: <IconManufacturing />,
  assembly: <IconParts />,
  electrical: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m13 2-8 10h5l-1 10 8-11h-5Z" fill="currentColor" /></svg>,
  programming: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m9 7-5 5 5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /><path d="m15 7 5 5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /><path d="M13 5 11 19" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>,
  testing: <IconCheck />,
  planning: <IconCalendar />,
  communications: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 11.5h8l6-4v9l-6-4H3Z" fill="currentColor" /><path d="M15 8.5c1.5.8 2.5 2.3 2.5 3.5s-1 2.7-2.5 3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></svg>,
  finance: <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10" cy="12" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M10 8.5v7M8.3 10.2H11c1.1 0 1.9.7 1.9 1.8S12.1 13.8 11 13.8H8.3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /><circle cx="17.2" cy="6.8" r="2.1" fill="currentColor" /></svg>,
  research: <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10" cy="10" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="m13.5 13.5 4.5 4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /><path d="M8.6 10h2.8M10 8.6v2.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" /></svg>,
  documentation: <IconTasks />,
  photography: <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12.5" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M7.5 7 9 5h6l1.5 2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>,
  video: <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="4" y="6" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="m16 10 4-2v8l-4-2Z" fill="currentColor" /><path d="M8 10.5v3l3-1.5Z" fill="currentColor" /></svg>,
  graphics: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 4a8 8 0 1 0 0 16 4 4 0 0 1 0-8h2a4 4 0 0 0 0-8Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" /><circle cx="8.2" cy="10" r="1.1" fill="currentColor" /><circle cx="10.2" cy="7.8" r="1" fill="currentColor" /><circle cx="14.2" cy="8" r="1.1" fill="currentColor" /></svg>,
  writing: <IconEdit />,
  web: <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M4.8 12h14.4M12 4.8a12 12 0 0 1 0 14.4M12 4.8a12 12 0 0 0 0 14.4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" /></svg>,
  social_media: <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="6" cy="12" r="2.3" fill="currentColor" /><circle cx="12" cy="6.5" r="2.3" fill="currentColor" /><circle cx="18" cy="12" r="2.3" fill="currentColor" /><path d="M7.7 11.2 10.4 8.5M13.6 8.5 16.3 11.2M8.1 13 10.7 14.8M13.3 14.8 15.9 13" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" /></svg>,
  engagement: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 14.5c1.6-2.7 4-4 7-4s5.4 1.3 7 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /><circle cx="8.2" cy="8.2" r="1.8" fill="currentColor" /><circle cx="15.8" cy="8.2" r="1.8" fill="currentColor" /><path d="M10.1 14.8h3.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></svg>,
  presentation: <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="10" rx="1.8" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M12 15v4M9 19h6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /><path d="M8 9h8M8 11.8h5.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" /></svg>,
  media_production: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 8h16v10H4Z" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M4 8 7 5h10l3 3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><path d="M10.4 11.2 14 13l-3.6 1.8Z" fill="currentColor" /></svg>,
  partnerships: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7.2 12.4 4.8 10a2.8 2.8 0 0 1 0-4l1-1a2.8 2.8 0 0 1 4 0l1.8 1.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><path d="M16.8 11.6 19.2 14a2.8 2.8 0 0 1 0 4l-1 1a2.8 2.8 0 0 1-4 0l-1.8-1.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><path d="M9.5 14.5 14.5 9.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /></svg>,
  game_analysis: <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="2.2" fill="currentColor" /><path d="M12 5.7v2.1M18.3 12h-2.1M12 18.3v-2.1M5.7 12h2.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" /></svg>,
  scouting: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 10.5h3.2c.8 0 1.4.4 1.8 1l.9 1.5h2.2l.9-1.5c.4-.6 1-1 1.8-1H19" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><path d="M6 10.5V8.8c0-.8.6-1.4 1.4-1.4h2c.8 0 1.4.4 1.8 1l.8 1.4h.8l.8-1.4c.4-.6 1-1 1.8-1h2c.8 0 1.4.6 1.4 1.4v1.7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" /><circle cx="9" cy="14" r="1.8" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="15" cy="14" r="1.8" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M9 15.8v1.7c0 .8.6 1.4 1.4 1.4h3.2c.8 0 1.4-.6 1.4-1.4v-1.7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" /></svg>,
  data_analysis: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 18.5h14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /><rect x="6" y="11" width="2.6" height="5.5" rx="0.6" fill="currentColor" /><rect x="10.7" y="8.3" width="2.6" height="8.2" rx="0.6" fill="currentColor" /><rect x="15.4" y="5.5" width="2.6" height="11" rx="0.6" fill="currentColor" /></svg>,
  risk_review: <IconRisk />,
  curriculum: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 5.5h10a2 2 0 0 1 2 2v10a2 2 0 0 0-2-2H6Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" /><path d="M8 8.2h6M8 11.1h6M8 14h4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" /></svg>,
  instruction: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 4.5 5 8.5l7 4 7-4-7-4Z" fill="currentColor" /><path d="M7 11v3.5c0 1.2 2.2 2.5 5 2.5s5-1.3 5-2.5V11" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></svg>,
  practice: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 8.2a5.2 5.2 0 1 1 0 7.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><path d="M7 5.5v5H2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>,
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
