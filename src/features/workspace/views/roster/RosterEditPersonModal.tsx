import React from "react";

import { IconTasks, IconTrash } from "@/components/shared/Icons";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import { PhotoUploadField } from "@/features/workspace/shared/media/PhotoUploadField";
import type { MemberPayload } from "@/types/payloads";

interface DisciplineOption {
  id: string;
  name: string;
}

interface RosterEditPersonModalProps {
  isOpen: boolean;
  memberEditDraft: MemberPayload | null;
  setMemberEditDraft: React.Dispatch<React.SetStateAction<MemberPayload | null>>;
  disciplineOptions: DisciplineOption[];
  selectedMemberId: string | null;
  isSavingMember: boolean;
  isDeletingMember: boolean;
  requestMemberPhotoUpload: (file: File) => Promise<string>;
  onClose: () => void;
  onSubmit: (milestone: React.FormEvent<HTMLFormElement>) => void;
  onDeleteMember: (id: string) => void;
  isElevatedRole: (role: MemberPayload["role"]) => boolean;
  getEmailPlaceholder: (role: MemberPayload["role"]) => string;
}

export const RosterEditPersonModal: React.FC<RosterEditPersonModalProps> = ({
  isOpen,
  memberEditDraft,
  setMemberEditDraft,
  disciplineOptions,
  selectedMemberId,
  isSavingMember,
  isDeletingMember,
  requestMemberPhotoUpload,
  onClose,
  onSubmit,
  onDeleteMember,
  isElevatedRole,
  getEmailPlaceholder,
}) => {
  if (!isOpen || !memberEditDraft) {
    return null;
  }

  return (
    <div
      className="modal-scrim"
      onClick={(milestone) => {
        if (milestone.target === milestone.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section aria-modal="true" className="modal-card roster-edit-modal" role="dialog">
        <div className="panel-header compact-header roster-modal-header">
          <div className="queue-section-header">
            <h3>Edit selected person</h3>
            <p className="section-copy">Update the name, email, or role for the selected team member.</p>
          </div>
        </div>
        <form className="compact-form roster-inline-form" onSubmit={onSubmit}>
          <PhotoUploadField
            currentUrl={memberEditDraft.photoUrl ?? ""}
            label="Profile photo"
            onChange={(value) => setMemberEditDraft((curr) => (curr ? { ...curr, photoUrl: value } : null))}
            onUpload={requestMemberPhotoUpload}
          />
          <label className="field">
            <span>Name</span>
            <input onChange={(e) => setMemberEditDraft((curr) => (curr ? { ...curr, name: e.target.value } : null))} value={memberEditDraft.name} />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              onChange={(e) => setMemberEditDraft((curr) => (curr ? { ...curr, email: e.target.value } : null))}
              placeholder={getEmailPlaceholder(memberEditDraft.role)}
              type="email"
              value={memberEditDraft.email}
            />
          </label>
          <label className="field">
            <span>Discipline</span>
            <FilterDropdown
              allLabel="None"
              ariaLabel="Set person discipline"
              className="task-queue-filter-menu-submenu"
              icon={<IconTasks />}
              onChange={(selection) => {
                setMemberEditDraft((curr) => (curr ? { ...curr, disciplineId: selection[0] ?? null } : null));
              }}
              options={disciplineOptions}
              singleSelect
              value={memberEditDraft.disciplineId ? [memberEditDraft.disciplineId] : []}
            />
          </label>
          <label className="field">
            <span>Role</span>
            <select
              onChange={(e) => {
                const nextRole = e.target.value as MemberPayload["role"];
                setMemberEditDraft((curr) =>
                  curr ? { ...curr, role: nextRole, elevated: isElevatedRole(nextRole) } : null,
                );
              }}
              value={memberEditDraft.role}
            >
              <option value="student">Student</option>
              <option value="lead">Lead</option>
              <option value="mentor">Mentor</option>
              <option value="admin">Admin</option>
              <option value="external">External access</option>
            </select>
          </label>
          <div className="modal-actions modal-wide">
            <button
              className="danger-action modal-actions-leading"
              disabled={isDeletingMember}
              onClick={() => {
                if (selectedMemberId) {
                  onDeleteMember(selectedMemberId);
                }
              }}
              type="button"
            >
              <IconTrash />
              {isDeletingMember ? "Deleting..." : "Delete"}
            </button>
            <button className="secondary-action" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="primary-action" disabled={isSavingMember} type="submit">
              {isSavingMember ? "Saving..." : "Update person"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
