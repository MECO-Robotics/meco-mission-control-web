import React from "react";

import { IconEdit } from "@/components/shared/Icons";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MemberRecord } from "@/types/recordsOrganization";

interface RosterMemberRowProps {
  member: MemberRecord;
  selectedMemberId: string | null;
  disciplines: BootstrapPayload["disciplines"];
  onSelectMember: (id: string) => void;
  onEditMember: (id: string) => void;
}

const isLeadStudent = (member: MemberRecord) =>
  member.role === "lead" || (member.role === "student" && member.elevated);

const isAdminMentor = (member: MemberRecord) =>
  member.role === "admin" || (member.role === "mentor" && member.elevated);

const getRoleBadge = (member: MemberRecord): { label: "L" | "C"; title: string } | null => {
  if (isLeadStudent(member)) {
    return { label: "L", title: "Lead student" };
  }
  if (isAdminMentor(member)) {
    return { label: "C", title: "Core mentor" };
  }
  return null;
};

const getInitials = (name: string): string => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("");
  return initials || name.slice(0, 1).toUpperCase();
};

const getDisciplineName = (member: MemberRecord, disciplines: BootstrapPayload["disciplines"]): string | null => {
  if (!member.disciplineId) {
    return null;
  }
  return disciplines.find((discipline) => discipline.id === member.disciplineId)?.name ?? member.disciplineId;
};

export const RosterMemberRow: React.FC<RosterMemberRowProps> = ({
  member,
  selectedMemberId,
  disciplines,
  onSelectMember,
  onEditMember,
}) => {
  const roleBadge = getRoleBadge(member);
  const disciplineName = getDisciplineName(member, disciplines);
  const rowClassName =
    member.id === selectedMemberId ? "member-row active editable-action-host" : "member-row editable-action-host";

  return (
    <div className={rowClassName} key={member.id}>
      <button className="member-row-main" onClick={() => onSelectMember(member.id)} type="button">
        {member.photoUrl ? (
          <img alt={`${member.name} profile picture`} className="profile-avatar" loading="lazy" src={member.photoUrl} />
        ) : (
          <div aria-hidden="true" className="profile-avatar profile-avatar-fallback">
            {getInitials(member.name)}
          </div>
        )}
        <span className="member-row-copy">
          <strong>{member.name}</strong>
          {member.email ? <span className="member-row-email">{member.email}</span> : null}
          {disciplineName ? (
            <span className="member-row-email" title="Discipline">
              Discipline: {disciplineName}
            </span>
          ) : null}
        </span>
      </button>
      <div className="member-row-trailing">
        <div className="member-row-actions editable-action-reveal">
          <button
            aria-label={`Edit ${member.name}`}
            className="member-action-button"
            data-tutorial-target="edit-roster-member-button"
            onClick={() => onEditMember(member.id)}
            title="Edit"
            type="button"
          >
            <IconEdit />
          </button>
        </div>
        {roleBadge ? <span className="member-role-badge" title={roleBadge.title}>{roleBadge.label}</span> : null}
      </div>
    </div>
  );
};
