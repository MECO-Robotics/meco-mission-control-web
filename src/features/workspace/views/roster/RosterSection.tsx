import React from "react";

import type { MemberRecord } from "@/types/recordsOrganization";

interface RosterSectionProps {
  className?: string;
  title: string;
  count: number;
  members: MemberRecord[];
  renderMember: (member: MemberRecord) => React.ReactNode;
}

export const RosterSection: React.FC<RosterSectionProps> = ({
  className,
  title,
  count,
  members,
  renderMember,
}) => (
  <div className={`panel-subsection${className ? ` ${className}` : ""}`}>
    <div className="roster-section-header">
      <div className="roster-section-title">
        <h3>{title}</h3>
        <span className="sidebar-tab-count">{count}</span>
      </div>
    </div>
    <div className="roster-list">{members.map(renderMember)}</div>
  </div>
);
