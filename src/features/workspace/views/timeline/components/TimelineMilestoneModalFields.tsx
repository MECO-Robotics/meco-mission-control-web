import { EVENT_TYPE_OPTIONS } from "@/features/workspace/shared/events/eventStyles";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneRecord } from "@/types/recordsExecution";
import type { MilestoneType } from "@/types/common";
import type React from "react";

import type { TimelineMilestoneDraft } from "@/features/workspace/shared/timeline/timelineEventHelpers";

interface TimelineMilestoneModalFieldsProps {
  activeDayMilestones: MilestoneRecord[];
  bootstrap: BootstrapPayload;
  milestoneDraft: TimelineMilestoneDraft;
  milestoneError: string | null;
  mode: "create" | "edit";
  setMilestoneDraft: React.Dispatch<React.SetStateAction<TimelineMilestoneDraft>>;
  setMilestoneEndDate: React.Dispatch<React.SetStateAction<string>>;
  setMilestoneEndTime: React.Dispatch<React.SetStateAction<string>>;
  setMilestoneStartDate: React.Dispatch<React.SetStateAction<string>>;
  setMilestoneStartTime: React.Dispatch<React.SetStateAction<string>>;
  milestoneEndDate: string;
  milestoneEndTime: string;
  milestoneStartDate: string;
  milestoneStartTime: string;
}

const FIELD_INPUT_STYLE = {
  background: "var(--bg-row-alt)",
  color: "var(--text-title)",
  border: "1px solid var(--border-base)",
} as const;

export function TimelineMilestoneModalFields({
  activeDayMilestones,
  bootstrap,
  milestoneDraft,
  milestoneError,
  mode,
  setMilestoneDraft,
  setMilestoneEndDate,
  setMilestoneEndTime,
  setMilestoneStartDate,
  setMilestoneStartTime,
  milestoneEndDate,
  milestoneEndTime,
  milestoneStartDate,
  milestoneStartTime,
}: TimelineMilestoneModalFieldsProps) {
  return (
    <>
      <label className="field modal-wide">
        <span style={{ color: "var(--text-title)" }}>Title</span>
        <input
          onChange={(milestone) =>
            setMilestoneDraft((current) => ({
              ...current,
              title: milestone.target.value,
            }))
          }
          required
          style={FIELD_INPUT_STYLE}
          value={milestoneDraft.title}
        />
      </label>

      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Type</span>
        <select
          onChange={(milestone) =>
            setMilestoneDraft((current) => ({
              ...current,
              type: milestone.target.value as MilestoneType,
            }))
          }
          style={FIELD_INPUT_STYLE}
          value={milestoneDraft.type}
        >
          {EVENT_TYPE_OPTIONS.map((option: { value: MilestoneType; label: string }) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Start date</span>
        <input
          onChange={(milestone) => setMilestoneStartDate(milestone.target.value)}
          required
          style={FIELD_INPUT_STYLE}
          type="date"
          value={milestoneStartDate}
        />
      </label>

      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Start time (optional)</span>
        <input
          onChange={(milestone) => setMilestoneStartTime(milestone.target.value)}
          style={FIELD_INPUT_STYLE}
          type="time"
          value={milestoneStartTime}
        />
      </label>

      <label className="field">
        <span style={{ color: "var(--text-title)" }}>End date (optional)</span>
        <input
          onChange={(milestone) => setMilestoneEndDate(milestone.target.value)}
          style={FIELD_INPUT_STYLE}
          type="date"
          value={milestoneEndDate}
        />
      </label>

      <label className="field">
        <span style={{ color: "var(--text-title)" }}>End time (optional)</span>
        <input
          onChange={(milestone) => setMilestoneEndTime(milestone.target.value)}
          style={FIELD_INPUT_STYLE}
          type="time"
          value={milestoneEndTime}
        />
      </label>

      <label className="field modal-wide">
        <span style={{ color: "var(--text-title)" }}>Description</span>
        <textarea
          onChange={(milestone) =>
            setMilestoneDraft((current) => ({
              ...current,
              description: milestone.target.value,
            }))
          }
          rows={3}
          style={FIELD_INPUT_STYLE}
          value={milestoneDraft.description}
        />
      </label>

      <label className="field modal-wide">
        <span style={{ color: "var(--text-title)" }}>Related projects</span>
        <select
          multiple
          onChange={(milestone) =>
            setMilestoneDraft((current) => ({
              ...current,
              projectIds: Array.from(milestone.currentTarget.selectedOptions, (option) => option.value),
            }))
          }
          size={Math.min(bootstrap.projects.length || 1, 6)}
          style={FIELD_INPUT_STYLE}
          value={milestoneDraft.projectIds}
        >
          {bootstrap.projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>

      <div className="checkbox-row modal-wide">
        <label className="checkbox-field">
          <input
            checked={milestoneDraft.isExternal}
            onChange={(milestone) =>
              setMilestoneDraft((current) => ({
                ...current,
                isExternal: milestone.target.checked,
              }))
            }
            type="checkbox"
          />
          <span style={{ color: "var(--text-title)" }}>External milestone/milestone</span>
        </label>
      </div>

      {milestoneError ? (
        <p className="section-copy modal-wide" style={{ color: "var(--official-red)" }}>
          {milestoneError}
        </p>
      ) : null}

      {mode === "edit" && activeDayMilestones.length > 1 ? (
        <p className="section-copy modal-wide">
          {activeDayMilestones.length} milestones are scheduled on this day. This editor opened the
          earliest one.
        </p>
      ) : null}
    </>
  );
}
