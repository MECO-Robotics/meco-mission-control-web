import type { Dispatch, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { SubsystemPayload } from "@/types/payloads";
import { PhotoUploadField } from "@/features/workspace/shared/media/PhotoUploadField";
import { WorkspaceColorField } from "../WorkspaceColorField";

import type { SubsystemEditorModalState } from "./buildSubsystemEditorModalState";
import { formatIterationVersion } from "./buildSubsystemEditorModalState";

interface SubsystemEditorModalFieldsProps {
  bootstrap: BootstrapPayload;
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
  subsystemDraft: SubsystemPayload;
  subsystemDraftRisks: string;
  subsystemModalMode: "create" | "edit";
  setSubsystemDraft: Dispatch<SetStateAction<SubsystemPayload>>;
  setSubsystemDraftRisks: (value: string) => void;
  subsystemState: SubsystemEditorModalState;
}

const fieldStyle = {
  background: "var(--bg-row-alt)",
  border: "1px solid var(--border-base)",
  color: "var(--text-title)",
} as const;

const labelStyle = {
  color: "var(--text-title)",
} as const;

const parentTextStyle = {
  color: "var(--text-copy)",
  margin: 0,
} as const;

export function SubsystemEditorModalFields({
  bootstrap,
  requestPhotoUpload,
  subsystemDraft,
  subsystemDraftRisks,
  subsystemModalMode,
  setSubsystemDraft,
  setSubsystemDraftRisks,
  subsystemState,
}: SubsystemEditorModalFieldsProps) {
  return (
    <>
      <label className="field modal-wide">
        <span style={labelStyle}>Name</span>
        <input
          onChange={(milestone) =>
            setSubsystemDraft((current) => ({
              ...current,
              name: milestone.target.value,
            }))
          }
          required
          style={fieldStyle}
          value={subsystemDraft.name}
        />
      </label>

      <label className="field modal-wide">
        <span style={labelStyle}>Description</span>
        <textarea
          onChange={(milestone) =>
            setSubsystemDraft((current) => ({
              ...current,
              description: milestone.target.value,
            }))
          }
          required
          rows={3}
          style={fieldStyle}
          value={subsystemDraft.description}
        />
      </label>

      <WorkspaceColorField
        label="Subsystem color"
        onChange={(color) =>
          setSubsystemDraft((current) => ({
            ...current,
            color,
          }))
        }
        seed={`${subsystemDraft.projectId}:${subsystemDraft.name}:subsystem`}
        value={subsystemDraft.color}
      />

      {subsystemModalMode === "edit" ? (
        <label className="field">
          <span style={labelStyle}>Iteration</span>
          <select
            onChange={(milestone) =>
              setSubsystemDraft((current) => ({
                ...current,
                iteration: Number(milestone.target.value),
              }))
            }
            style={fieldStyle}
            value={subsystemDraft.iteration ?? 1}
          >
            {subsystemState.subsystemIterationOptions.map((iteration) => (
              <option key={iteration} value={iteration}>
                {formatIterationVersion(iteration)}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {subsystemModalMode === "create" ? (
        <label className="field">
          <span style={labelStyle}>Parent subsystem</span>
          <select
            onChange={(milestone) =>
              setSubsystemDraft((current) => ({
                ...current,
                parentSubsystemId: milestone.target.value || null,
              }))
            }
            style={fieldStyle}
            value={subsystemDraft.parentSubsystemId ?? ""}
          >
            <option value="">No parent (root subsystem)</option>
            {subsystemState.parentSubsystemOptions.map((subsystem) => (
              <option key={subsystem.id} value={subsystem.id}>
                {subsystem.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <div className="field modal-wide">
          <span style={labelStyle}>Parent subsystem</span>
          <p style={parentTextStyle}>
            {subsystemState.currentSubsystem?.isCore
              ? "Drivetrain is the root subsystem and has no parent."
              : subsystemState.parentSubsystemName ?? "Unassigned"}
          </p>
        </div>
      )}

      <label className="field">
        <span style={labelStyle}>Responsible engineer</span>
        <select
          onChange={(milestone) =>
            setSubsystemDraft((current) => ({
              ...current,
              responsibleEngineerId: milestone.target.value || null,
            }))
          }
          style={fieldStyle}
          value={subsystemDraft.responsibleEngineerId ?? ""}
        >
          <option value="">Unassigned</option>
          {bootstrap.members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span style={labelStyle}>Mentors</span>
        <select
          multiple
          onChange={(milestone) =>
            setSubsystemDraft((current) => ({
              ...current,
              mentorIds: Array.from(milestone.currentTarget.selectedOptions, (option) => option.value),
            }))
          }
          size={Math.min(
            bootstrap.members.filter(
              (member) => member.role === "mentor" || member.role === "admin",
            ).length || 1,
            5,
          )}
          style={fieldStyle}
          value={subsystemDraft.mentorIds}
        >
          {bootstrap.members
            .filter((member) => member.role === "mentor" || member.role === "admin")
            .map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
        </select>
      </label>

      <label className="field modal-wide">
        <span style={labelStyle}>Risks</span>
        <textarea
          onChange={(milestone) => setSubsystemDraftRisks(milestone.target.value)}
          placeholder="Comma-separated risks"
          rows={3}
          style={fieldStyle}
          value={subsystemDraftRisks}
        />
      </label>

      <PhotoUploadField
        currentUrl={subsystemDraft.photoUrl}
        label="Subsystem photo"
        onChange={(value) => setSubsystemDraft((current) => ({ ...current, photoUrl: value }))}
        onUpload={async (file) => {
          if (!subsystemState.subsystemPhotoProjectId) {
            throw new Error("No project is available for photo upload.");
          }

          return requestPhotoUpload(subsystemState.subsystemPhotoProjectId, file);
        }}
      />
    </>
  );
}
