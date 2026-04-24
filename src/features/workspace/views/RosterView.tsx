import React from "react";
import { IconEdit, IconPlus, IconTrash } from "../../../components/shared/Icons";
import type { BootstrapPayload, MemberPayload, MemberRecord } from "../../../types";
import { WORKSPACE_PANEL_CLASS } from "../shared/workspaceTypes";

interface RosterViewProps {
    bootstrap: BootstrapPayload;
    selectedMemberId: string | null;
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
    handleUpdateMember: (e: React.FormEvent<HTMLFormElement>) => void;
    handleDeleteMember: (id: string) => void;
    isSavingMember: boolean;
    isDeletingMember: boolean;
    students: MemberRecord[];
    rosterMentors: MemberRecord[];
}

export const RosterView: React.FC<RosterViewProps> = ({
    bootstrap,
    selectedMemberId,
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
    handleUpdateMember,
    handleDeleteMember,
    isSavingMember,
    isDeletingMember,
    students,
    rosterMentors,
}) => {
    const leadStudents = students.filter((member) => member.role === "lead");
    const regularStudents = students.filter((member) => member.role === "student");

    const openAddPersonPanel = (role: MemberPayload["role"]) => {
        setMemberForm({ name: "", role });
        setIsAddPersonOpen(true);
        setIsEditPersonOpen(false);
    };

    const closeAddPersonPopup = () => {
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

    const renderMemberRow = (member: MemberRecord) => (
        <div className={member.id === selectedMemberId ? "member-row active editable-action-host" : "member-row editable-action-host"} key={member.id}>
            <button className="member-row-main" onClick={() => selectMember(member.id, bootstrap)} type="button">
                <strong>{member.name}</strong>
            </button>
            <div className="member-row-actions editable-action-reveal">
                <button
                    aria-label={`Edit ${member.name}`}
                    className="member-action-button"
                    onClick={() => openEditPersonPopup(member.id)}
                    title="Edit"
                    type="button"
                >
                    <IconEdit />
                </button>
            </div>
        </div>
    );

    return (
        <section className={`panel dense-panel roster-layout ${WORKSPACE_PANEL_CLASS}`}>
            <div className="panel-header compact-header">
                <div className="queue-section-header">
                    <h2>Roster</h2>
                    <p className="section-copy">Manage team members, permissions, and roles.</p>
                </div>
            </div>
            <div className="roster-columns">
                <div className="panel-subsection">
                    <div className="roster-section-header">
                        <div className="roster-section-title">
                            <h3>Students</h3>
                            <span className="sidebar-tab-count">{regularStudents.length}</span>
                        </div>
                        <button className="roster-section-add" onClick={() => openAddPersonPanel("student")} type="button"><IconPlus /></button>
                    </div>
                    <div className="roster-list">
                        {regularStudents.map(renderMemberRow)}
                    </div>
                </div>

                <div className="panel-subsection">
                    <div className="roster-section-header">
                        <div className="roster-section-title">
                            <h3>Lead Students</h3>
                            <span className="sidebar-tab-count">{leadStudents.length}</span>
                        </div>
                        <button className="roster-section-add" onClick={() => openAddPersonPanel("lead")} type="button"><IconPlus /></button>
                    </div>
                    <div className="roster-list">
                        {leadStudents.map(renderMemberRow)}
                    </div>
                </div>

                <div className="panel-subsection">
                    <div className="roster-section-header">
                        <div className="roster-section-title">
                            <h3>Mentors</h3>
                            <span className="sidebar-tab-count">{rosterMentors.length}</span>
                        </div>
                        <button className="roster-section-add" onClick={() => openAddPersonPanel("mentor")} type="button"><IconPlus /></button>
                    </div>
                    <div className="roster-list">
                        {rosterMentors.map(renderMemberRow)}
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
                                <p className="section-copy">Create a new roster entry and assign its role.</p>
                            </div>
                        </div>
                        <form className="compact-form roster-inline-form" onSubmit={handleCreateMember}>
                            <label className="field">
                                <span>Name</span>
                                <input onChange={(e) => setMemberForm((curr) => ({ ...curr, name: e.target.value }))} required value={memberForm.name} />
                            </label>
                            <label className="field">
                                <span>Role</span>
                                <select onChange={(e) => setMemberForm((curr) => ({ ...curr, role: e.target.value as MemberPayload["role"] }))} value={memberForm.role}>
                                    <option value="student">Student</option>
                                    <option value="lead">Lead</option>
                                    <option value="mentor">Mentor</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </label>
                            <div className="modal-actions modal-wide">
                                <button className="secondary-action" onClick={closeAddPersonPopup} type="button">Cancel</button>
                                <button className="primary-action" disabled={isSavingMember} type="submit">{isSavingMember ? "Saving..." : "Add person"}</button>
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
                                <p className="section-copy">Update the name or role for the selected team member.</p>
                            </div>
                        </div>
                        <form className="compact-form roster-inline-form" onSubmit={handleUpdateMember}>
                            <label className="field">
                                <span>Name</span>
                                <input onChange={(e) => setMemberEditDraft(curr => curr ? { ...curr, name: e.target.value } : null)} value={memberEditDraft.name} />
                            </label>
                            <label className="field">
                                <span>Role</span>
                                <select onChange={(e) => setMemberEditDraft(curr => curr ? { ...curr, role: e.target.value as MemberPayload["role"] } : null)} value={memberEditDraft.role}>
                                    <option value="student">Student</option>
                                    <option value="lead">Lead</option>
                                    <option value="mentor">Mentor</option>
                                    <option value="admin">Admin</option>
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
