import type { Dispatch, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneType } from "@/types/common";
import { EVENT_TYPE_STYLES as MILESTONE_TYPE_STYLES } from "@/features/workspace/shared/events/eventStyles";
import type { TimelineMilestoneDraft } from "@/features/workspace/shared/timeline/timelineEventHelpers";

const MILESTONE_TYPE_OPTIONS: { id: MilestoneType; name: string }[] = (
  Object.entries(MILESTONE_TYPE_STYLES) as [MilestoneType, (typeof MILESTONE_TYPE_STYLES)[MilestoneType]][]
).map(([id, style]) => ({
  id,
  name: style.label,
}));

interface MilestonesMilestoneModalFieldsProps {
  bootstrap: BootstrapPayload;
  milestoneEndDate: string;
  milestoneEndTime: string;
  milestoneError: string | null;
  milestoneStartDate: string;
  milestoneStartTime: string;
  milestoneDraft: TimelineMilestoneDraft;
  setMilestoneEndDate: Dispatch<SetStateAction<string>>;
  setMilestoneEndTime: Dispatch<SetStateAction<string>>;
  setMilestoneStartDate: Dispatch<SetStateAction<string>>;
  setMilestoneStartTime: Dispatch<SetStateAction<string>>;
  setMilestoneDraft: Dispatch<SetStateAction<TimelineMilestoneDraft>>;
}

const FIELD_STYLE = {
  background: "var(--bg-row-alt)",
  border: "1px solid var(--border-base)",
  color: "var(--text-title)",
} as const;

const LABEL_STYLE = {
  color: "var(--text-title)",
} as const;

export function MilestonesMilestoneModalFields({
  bootstrap,
  milestoneEndDate,
  milestoneEndTime,
  milestoneError,
  milestoneStartDate,
  milestoneStartTime,
  milestoneDraft,
  setMilestoneEndDate,
  setMilestoneEndTime,
  setMilestoneStartDate,
  setMilestoneStartTime,
  setMilestoneDraft,
}: MilestonesMilestoneModalFieldsProps) {
  return (
    <>
      <label className="field modal-wide">
        <span style={LABEL_STYLE}>Title</span>
        <input
          onChange={(milestone) =>
            setMilestoneDraft((current) => ({
              ...current,
              title: milestone.target.value,
            }))
          }
          required
          style={FIELD_STYLE}
          value={milestoneDraft.title}
        />
      </label>

      <label className="field">
        <span style={LABEL_STYLE}>Type</span>
        <select
          onChange={(milestone) =>
            setMilestoneDraft((current) => ({
              ...current,
              type: milestone.target.value as MilestoneType,
            }))
          }
          style={FIELD_STYLE}
          value={milestoneDraft.type}
        >
          {MILESTONE_TYPE_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span style={LABEL_STYLE}>Start date</span>
        <input
          onChange={(milestone) => setMilestoneStartDate(milestone.target.value)}
          required
          style={FIELD_STYLE}
          type="date"
          value={milestoneStartDate}
        />
      </label>

      <label className="field">
        <span style={LABEL_STYLE}>Start time (optional)</span>
        <input
          onChange={(milestone) => setMilestoneStartTime(milestone.target.value)}
          style={FIELD_STYLE}
          type="time"
          value={milestoneStartTime}
        />
      </label>

      <label className="field">
        <span style={LABEL_STYLE}>End date (optional)</span>
        <input
          onChange={(milestone) => setMilestoneEndDate(milestone.target.value)}
          style={FIELD_STYLE}
          type="date"
          value={milestoneEndDate}
        />
      </label>

      <label className="field">
        <span style={LABEL_STYLE}>End time (optional)</span>
        <input
          onChange={(milestone) => setMilestoneEndTime(milestone.target.value)}
          style={FIELD_STYLE}
          type="time"
          value={milestoneEndTime}
        />
      </label>

      <label className="field modal-wide">
        <span style={LABEL_STYLE}>Description</span>
        <textarea
          onChange={(milestone) =>
            setMilestoneDraft((current) => ({
              ...current,
              description: milestone.target.value,
            }))
          }
          rows={3}
          style={FIELD_STYLE}
          value={milestoneDraft.description}
        />
      </label>

      <label className="field modal-wide">
        <span style={LABEL_STYLE}>Related projects</span>
        <select
          multiple
          onChange={(milestone) =>
            setMilestoneDraft((current) => ({
              ...current,
              projectIds: Array.from(milestone.currentTarget.selectedOptions, (option) => option.value),
            }))
          }
          size={Math.min(bootstrap.projects.length || 1, 6)}
          style={{
            ...FIELD_STYLE,
            minHeight: "5rem",
          }}
          value={milestoneDraft.projectIds}
        >
          {bootstrap.projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field modal-wide" style={{ display: "flex", alignItems: "center" }}>
        <input
          checked={milestoneDraft.isExternal}
          onChange={(milestone) =>
            setMilestoneDraft((current) => ({
              ...current,
              isExternal: milestone.target.checked,
            }))
          }
          style={{ width: "auto" }}
          type="checkbox"
        />
        <span style={LABEL_STYLE}>External milestone</span>
      </label>

      {milestoneError ? (
        <p className="section-copy" style={{ color: "var(--official-red)" }}>
          {milestoneError}
        </p>
      ) : null}
    </>
  );
}
