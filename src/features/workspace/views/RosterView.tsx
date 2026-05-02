import React from "react";
import { IconEdit, IconPlus, IconTrash } from "@/components/shared";
import { PhotoUploadField } from "@/features/workspace/shared";
import type { BootstrapPayload, MemberPayload, MemberRecord } from "@/types";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared";
import { isMemberActiveInSeason } from "@/lib/appUtils";

interface RosterViewProps {
    allMembers: MemberRecord[];
    bootstrap: BootstrapPayload;
    selectedMemberId: string | null;
    selectedSeasonId: string | null;
    selectMember: (id: string | null, payload: BootstrapPayload) => void;
    isAddPersonOpen: boolean;
    setIsAddPersonOpen: (open: boolean) => void;
    isEditPersonOpen: boolean;
    setIsEditPersonOpen: (open: boolean) => void;
    memberForm: MemberPayload;
    setMemberForm: React.Dispatch<React.SetStateAction<MemberPayload>>;
    memberEditDraft: MemberPayload | null;
    setMemberEditDraft: React.Dispatch<React.SetStateAction<MemberPayload | null>>;
    handleCreateMember: (e: React.FormEvent<HTMLFormElement>) => void;
    handleReactivateMemberForSeason: (memberId: string) => Promise<void>;
    handleUpdateMember: (e: React.FormEvent<HTMLFormElement>) => void;
    handleDeleteMember: (id: string) => void;
    requestMemberPhotoUpload: (file: File) => Promise<string>;
    isSavingMember: boolean;
    isDeletingMember: boolean;
    students: MemberRecord[];
    rosterMentors: MemberRecord[];
    externalMembers: MemberRecord[];
}

export const RosterView: React.FC<RosterViewProps> = ({
    allMembers,
    bootstrap,
    selectedMemberId,
    selectedSeasonId,
    selectMember,
    isAddPersonOpen,
    setIsAddPersonOpen,
    isEditPersonOpen,
    setIsEditPersonOpen,
    memberForm,
    setMemberForm,
    memberEditDraft,
    setMemberEditDraft,
    handleCreateMember,
    handleReactivateMemberForSeason,
    handleUpdateMember,
    handleDeleteMember,
    requestMemberPhotoUpload,
    isSavingMember,
    isDeletingMember,
    students,
    rosterMentors,
    externalMembers,
}) => {
    const [reactivateExistingMember, setReactivateExistingMember] = React.useState(false);
    const [reactivateMemberId, setReactivateMemberId] = React.useState("");
    const isLeadStudent = (member: MemberRecord) => member.role === "lead" || (member.role === "student" && member.elevated);
    const isAdminMentor = (member: MemberRecord) => member.role === "admin" || (member.role === "mentor" && member.elevated);
    const sortedStudents = [...students].sort((a, b) => {
        const priority = Number(isLeadStudent(b)) - Number(isLeadStudent(a));
        return priority !== 0 ? priority : a.name.localeCompare(b.name);
    });
    const sortedMentors = [...rosterMentors].sort((a, b) => {
        const priority = Number(isAdminMentor(b)) - Number(isAdminMentor(a));
        return priority !== 0 ? priority : a.name.localeCompare(b.name);
    });
    const sortedExternalMembers = [...externalMembers].sort((a, b) => a.name.localeCompare(b.name));
    const getRoleBadge = (member: MemberRecord): { label: "L" | "C"; title: string } | null => {
        if (isLeadStudent(member)) {
            return { label: "L", title: "Lead student" };
        }
        if (isAdminMentor(member)) {
            return { label: "C", title: "Core mentor" };
        }
        return null;
    };
    const sortedDisciplines = React.useMemo(
        () => [...bootstrap.disciplines].sort((a, b) => a.name.localeCompare(b.name)),
        [bootstrap.disciplines],
    );
    const isElevatedRole = (role: MemberPayload["role"]) => role === "lead" || role === "admin";
    const getEmailPlaceholder = (role: MemberPayload["role"]) =>
        role === "external" ? "name@example.org" : "name@mecorobotics.org";
    const inactiveMembers = React.useMemo(() => {
        if (!selectedSeasonId) {
            return [];
        }

        return allMembers
            .filter((member) => !isMemberActiveInSeason(member, selectedSeasonId))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [allMembers, selectedSeasonId]);

    const openAddPersonPanel = (role: MemberPayload["role"]) => {
        setMemberForm({ name: "", email: "", photoUrl: "", role, elevated: isElevatedRole(role), disciplineId: null });
        setReactivateExistingMember(false);
        setReactivateMemberId("");
        setIsAddPersonOpen(true);
        setIsEditPersonOpen(false);
    };

    const closeAddPersonPopup = () => {
        setReactivateExistingMember(false);
        setReactivateMemberId("");
        setIsAddPersonOpen(false);
    };

    const openEditPersonPopup = (id: string) => {
        selectMember(id, bootstrap);
        setIsEditPersonOpen(true);
        setIsAddPersonOpen(false);
    };

    const closeEditPersonPopup = () => {
        setIsEditPersonOpen(false);
    };

    const handleAddMemberSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        if (!reactivateExistingMember) {
            handleCreateMember(event);
            return;
        }

        event.preventDefault();
        if (!reactivateMemberId) {
            return;
        }
        void handleReactivateMemberForSeason(reactivateMemberId);
    };

    const renderMemberRow = (member: MemberRecord) => {
        const roleBadge = getRoleBadge(member);
        const disciplineName =
            member.disciplineId
                ? bootstrap.disciplines.find((discipline) => discipline.id === member.disciplineId)?.name ?? member.disciplineId
                : null;
        const initials = member.name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.slice(0, 1).toUpperCase())
            .join("");
        return (
            <div className={member.id === selectedMemberId ? "member-row active editable-action-host" : "member-row editable-action-host"} key={member.id}>
                <button className="member-row-main" onClick={() => selectMember(member.id, bootstrap)} type="button">
                    {member.photoUrl ? (
                        <img alt={`${member.name} profile picture`} className="profile-avatar" loading="lazy" src={member.photoUrl} />
                    ) : (
                        <div aria-hidden="true" className="profile-avatar profile-avatar-fallback">
                            {initials || member.name.slice(0, 1).toUpperCase()}
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
                            onClick={() => openEditPersonPopup(member.id)}
                            title="Edit"
                            type="button"
                        >
                            <IconEdit />
                        </button>
                    </div>
                    {roleBadge ? (
                        <span className="member-role-badge" title={roleBadge.title}>
                            {roleBadge.label}
                        </span>
                    ) : null}
                </div>
            </div>
        );
    };

    return (
        <section className={`panel dense-panel roster-layout ${WORKSPACE_PANEL_CLASS}`}>
            <div className="panel-header compact-header">
                <div className="queue-section-header">
                    <h2>Roster</h2>
                    <p className="section-copy">Manage team members, external access, and roles.</p>
                </div>
            </div>
            <div className="roster-columns">
                <div className="panel-subsection">
                    <div className="roster-section-header">
                        <div className="roster-section-title">
                            <h3>Students</h3>
                            <span className="sidebar-tab-count">{sortedStudents.length}</span>
                        </div>
                        <button
                            className="roster-section-add"
                            data-tutorial-target="create-student-button"
                            onClick={() => openAddPersonPanel("student")}
                            type="button"
                        >
                            <IconPlus />
                        </button>
                    </div>
                    <div className="roster-list">
                        {sortedStudents.map(renderMemberRow)}
                    </div>
                </div>

                <div className="panel-subsection">
                    <div className="roster-section-header">
                        <div className="roster-section-title">
                            <h3>Mentors</h3>
                            <span className="sidebar-tab-count">{sortedMentors.length}</span>
                        </div>
                        <button className="roster-section-add" onClick={() => openAddPersonPanel("mentor")} type="button"><IconPlus /></button>
                    </div>
                    <div className="roster-list">
                        {sortedMentors.map(renderMemberRow)}
                    </div>
                </div>

                <div className="panel-subsection">
                    <div className="roster-section-header">
                        <div className="roster-section-title">
                            <h3>External access</h3>
                            <span className="sidebar-tab-count">{sortedExternalMembers.length}</span>
                        </div>
                        <button className="roster-section-add" onClick={() => openAddPersonPanel("external")} type="button"><IconPlus /></button>
                    </div>
                    <div className="roster-list">
                        {sortedExternalMembers.map(renderMemberRow)}
                    </div>
                </div>
            </div>

            {isAddPersonOpen ? (
                <div
                    className="modal-scrim"
                    onClick={(event) => {
                        if (event.target === event.currentTarget) {
                            closeAddPersonPopup();
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
                        <form className="compact-form roster-inline-form" onSubmit={handleAddMemberSubmit}>
                            <div className="field modal-wide">
                                <span>Mode</span>
                                <label className="checkbox-field">
                                    <input
                                        checked={reactivateExistingMember}
                                        onChange={(event) => {
                                            const isChecked = event.target.checked;
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
                                        <select
                                            onChange={(event) => setReactivateMemberId(event.target.value)}
                                            required
                                            value={reactivateMemberId}
                                        >
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
                                        <input onChange={(e) => setMemberForm((curr) => ({ ...curr, email: e.target.value }))} placeholder={getEmailPlaceholder(memberForm.role)} type="email" value={memberForm.email} />
                                    </label>
                                    <label className="field">
                                        <span>Discipline</span>
                                        <select
                                            onChange={(event) => {
                                                const nextValue = event.target.value;
                                                setMemberForm((curr) => ({ ...curr, disciplineId: nextValue ? nextValue : null }));
                                            }}
                                            value={memberForm.disciplineId ?? ""}
                                        >
                                            <option value="">None</option>
                                            {sortedDisciplines.map((discipline) => (
                                                <option key={discipline.id} value={discipline.id}>
                                                    {discipline.name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="field">
                                        <span>Role</span>
                                        <select onChange={(e) => {
                                            const nextRole = e.target.value as MemberPayload["role"];
                                            setMemberForm((curr) => ({ ...curr, role: nextRole, elevated: isElevatedRole(nextRole) }));
                                        }} value={memberForm.role}>
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
                                <button className="secondary-action" onClick={closeAddPersonPopup} type="button">Cancel</button>
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
            ) : null}

            {isEditPersonOpen && memberEditDraft ? (
                <div
                    className="modal-scrim"
                    onClick={(event) => {
                        if (event.target === event.currentTarget) {
                            closeEditPersonPopup();
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
                        <form className="compact-form roster-inline-form" onSubmit={handleUpdateMember}>
                            <PhotoUploadField
                                currentUrl={memberEditDraft.photoUrl ?? ""}
                                label="Profile photo"
                                onChange={(value) =>
                                    setMemberEditDraft((curr) => (curr ? { ...curr, photoUrl: value } : null))
                                }
                                onUpload={requestMemberPhotoUpload}
                            />
                            <label className="field">
                                <span>Name</span>
                                <input onChange={(e) => setMemberEditDraft(curr => curr ? { ...curr, name: e.target.value } : null)} value={memberEditDraft.name} />
                            </label>
                            <label className="field">
                                <span>Email</span>
                                <input onChange={(e) => setMemberEditDraft(curr => curr ? { ...curr, email: e.target.value } : null)} placeholder={getEmailPlaceholder(memberEditDraft.role)} type="email" value={memberEditDraft.email} />
                            </label>
                            <label className="field">
                                <span>Discipline</span>
                                <select
                                    onChange={(event) => {
                                        const nextValue = event.target.value;
                                        setMemberEditDraft((curr) => (curr ? { ...curr, disciplineId: nextValue ? nextValue : null } : null));
                                    }}
                                    value={memberEditDraft.disciplineId ?? ""}
                                >
                                    <option value="">None</option>
                                    {sortedDisciplines.map((discipline) => (
                                        <option key={discipline.id} value={discipline.id}>
                                            {discipline.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="field">
                                <span>Role</span>
                                <select onChange={(e) => {
                                    const nextRole = e.target.value as MemberPayload["role"];
                                    setMemberEditDraft(curr => curr ? { ...curr, role: nextRole, elevated: isElevatedRole(nextRole) } : null);
                                }} value={memberEditDraft.role}>
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
                                            handleDeleteMember(selectedMemberId);
                                        }
                                    }}
                                    type="button"
                                >
                                    <IconTrash />
                                    {isDeletingMember ? "Deleting..." : "Delete"}
                                </button>
                                <button className="secondary-action" onClick={closeEditPersonPopup} type="button">Cancel</button>
                                <button className="primary-action" disabled={isSavingMember} type="submit">{isSavingMember ? "Saving..." : "Update person"}</button>
                            </div>
                        </form>
                    </section>
                </div>
            ) : null}
        </section>
    );
};
