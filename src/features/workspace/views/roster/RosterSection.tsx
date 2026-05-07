import React from "react";

import { IconPlus } from "@/components/shared/Icons";
import type { MemberRecord } from "@/types/recordsOrganization";

interface RosterSectionProps {
  title: string;
  count: number;
  members: MemberRecord[];
  addTarget: "student" | "mentor" | "external";
  onAdd: (role: "student" | "mentor" | "external") => void;
  renderMember: (member: MemberRecord) => React.ReactNode;
  tutorialTarget?: string;
}

export const RosterSection: React.FC<RosterSectionProps> = ({
  title,
  count,
  members,
  addTarget,
  onAdd,
  renderMember,
  tutorialTarget,
}) => (
  <div className="panel-subsection">
    <div className="roster-section-header">
      <div className="roster-section-title">
        <h3>{title}</h3>
        <span className="sidebar-tab-count">{count}</span>
      </div>
      <button
        className="roster-section-add"
        data-tutorial-target={tutorialTarget}
        onClick={() => onAdd(addTarget)}
        type="button"
      >
        <IconPlus />
      </button>
    </div>
    <div className="roster-list">{members.map(renderMember)}</div>
  </div>
);
