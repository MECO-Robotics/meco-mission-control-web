import React from "react";

import type { MemberRecord } from "@/types/recordsOrganization";

interface RosterSectionProps {
  className?: string;
  title: string;
  count: number;
  presentCount: number;
  members: MemberRecord[];
  renderMember: (member: MemberRecord) => React.ReactNode;
}

export const RosterSection: React.FC<RosterSectionProps> = ({
  className,
  title,
  count,
  presentCount,
  members,
  renderMember,
}) => (
  <div className={`panel-subsection${className ? ` ${className}` : ""}`}>
    <div className="roster-section-header">
      <div className="roster-section-title">
        <h2>{title}</h2>
        <span aria-label={`${presentCount} of ${count} here today`} className="sidebar-tab-count">{presentCount}/{count} here</span>
      </div>
    </div>
    <div className="roster-list">{members.map(renderMember)}</div>
  </div>
);
