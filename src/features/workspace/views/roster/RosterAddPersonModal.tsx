import React from "react";

import { IconTasks } from "@/components/shared/Icons";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import { PhotoUploadField } from "@/features/workspace/shared/media/PhotoUploadField";
import type { MemberPayload } from "@/types/payloads";
import type { MemberRecord } from "@/types/recordsOrganization";

interface DisciplineOption {
  id: string;
  name: string;
}

interface RosterAddPersonModalProps {
  isOpen: boolean;
  memberForm: MemberPayload;
  setMemberForm: React.Dispatch<React.SetStateAction<MemberPayload>>;
  disciplineOptions: DisciplineOption[];
  inactiveMembers: MemberRecord[];
  reactivateExistingMember: boolean;
  setReactivateExistingMember: React.Dispatch<React.SetStateAction<boolean>>;
  reactivateMemberId: string;
  setReactivateMemberId: React.Dispatch<React.SetStateAction<string>>;
  isSavingMember: boolean;
  requestMemberPhotoUpload: (file: File) => Promise<string>;
  onClose: () => void;
  onSubmit: (milestone: React.FormEvent<HTMLFormElement>) => void;
  isElevatedRole: (role: MemberPayload["role"]) => boolean;
  getEmailPlaceholder: (role: MemberPayload["role"]) => string;
}

export const RosterAddPersonModal: React.FC<RosterAddPersonModalProps> = ({
  isOpen,
  memberForm,
  setMemberForm,
  disciplineOptions,
  inactiveMembers,
  reactivateExistingMember,
  setReactivateExistingMember,
  reactivateMemberId,
  setReactivateMemberId,
  isSavingMember,
  requestMemberPhotoUpload,
  onClose,
  onSubmit,
  isElevatedRole,
  getEmailPlaceholder,
}) => {
  if (!isOpen) {
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
            <h3>Add person</h3>
            <p className="section-copy">Create a new roster entry or reactivate one for this season.</p>
          </div>
        </div>
        <form className="compact-form roster-inline-form" onSubmit={onSubmit}>
          <div className="field modal-wide">
            <span>Mode</span>
            <label className="checkbox-field">
              <input
                checked={reactivateExistingMember}
                onChange={(milestone) => {
                  const isChecked = milestone.target.checked;
                  setReactivateExistingMember(isChecked);
                  if (!isChecked) {
                    setReactivateMemberId("");
                  }
                }}
                type="checkbox"
              />
              <span>Reactivate existing inactive person for this season</span>
            </label>
          </div>
          {reactivateExistingMember ? (
            <>
              <label className="field">
                <span>Inactive person</span>
                <select onChange={(milestone) => setReactivateMemberId(milestone.target.value)} required value={reactivateMemberId}>
                  <option value="">Select person</option>
                  {inactiveMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                      {member.email ? ` (${member.email})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              {inactiveMembers.length === 0 ? (
                <p className="section-copy">No inactive roster people are available for this season.</p>
              ) : null}
            </>
          ) : (
            <>
              <PhotoUploadField
                currentUrl={memberForm.photoUrl}
                label="Profile photo"
                onChange={(value) => setMemberForm((curr) => ({ ...curr, photoUrl: value }))}
                onUpload={requestMemberPhotoUpload}
              />
              <label className="field">
                <span>Name</span>
                <input onChange={(e) => setMemberForm((curr) => ({ ...curr, name: e.target.value }))} required value={memberForm.name} />
              </label>
              <label className="field">
                <span>Email</span>
                <input
                  onChange={(e) => setMemberForm((curr) => ({ ...curr, email: e.target.value }))}
                  placeholder={getEmailPlaceholder(memberForm.role)}
                  type="email"
                  value={memberForm.email}
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
                    setMemberForm((curr) => ({
                      ...curr,
                      disciplineId: selection[0] ?? null,
                    }));
                  }}
                  options={disciplineOptions}
                  singleSelect
                  value={memberForm.disciplineId ? [memberForm.disciplineId] : []}
                />
              </label>
              <label className="field">
                <span>Role</span>
                <select
                  onChange={(e) => {
                    const nextRole = e.target.value as MemberPayload["role"];
                    setMemberForm((curr) => ({ ...curr, role: nextRole, elevated: isElevatedRole(nextRole) }));
                  }}
                  value={memberForm.role}
                >
                  <option value="student">Student</option>
                  <option value="lead">Lead</option>
                  <option value="mentor">Mentor</option>
                  <option value="admin">Admin</option>
                  <option value="external">External access</option>
                </select>
              </label>
            </>
          )}
          <div className="modal-actions modal-wide">
            <button className="secondary-action" onClick={onClose} type="button">
              Cancel
            </button>
            <button
              className="primary-action"
              disabled={isSavingMember || (reactivateExistingMember && (reactivateMemberId.length === 0 || inactiveMembers.length === 0))}
              type="submit"
            >
              {isSavingMember ? "Saving..." : reactivateExistingMember ? "Reactivate person" : "Add person"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
