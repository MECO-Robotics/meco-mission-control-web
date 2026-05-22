import type React from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { MeetingPayload } from "@/types/payloads";

interface MeetingScheduleModalProps {
  bootstrap: BootstrapPayload;
  draft: MeetingPayload;
  error: string | null;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  setDraft: React.Dispatch<React.SetStateAction<MeetingPayload>>;
}

function datePart(value: string) {
  return value.slice(0, 10);
}

function timePart(value: string) {
  return value.includes("T") ? value.slice(11, 16) : "";
}

function combineDateTime(date: string, time: string) {
  return time.trim().length > 0 ? `${date}T${time}` : date;
}

function resolveEndDateTime(date: string, time: string) {
  const normalizedDate = date.trim();
  return normalizedDate.length > 0 ? combineDateTime(normalizedDate, time) : null;
}

export function MeetingScheduleModal({
  bootstrap,
  draft,
  error,
  isOpen,
  isSaving,
  onClose,
  onSubmit,
  setDraft,
}: MeetingScheduleModalProps) {
  if (!isOpen) {
    return null;
  }

  const startDate = datePart(draft.startDateTime);
  const startTime = timePart(draft.startDateTime);
  const endDate = draft.endDateTime ? datePart(draft.endDateTime) : startDate;
  const endTime = draft.endDateTime ? timePart(draft.endDateTime) : "";

  return (
    <div
      className="modal-scrim"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section aria-modal="true" className="modal-card meeting-schedule-modal" role="dialog">
        <div className="panel-header compact-header roster-modal-header">
          <div className="queue-section-header">
            <h3>Add meeting</h3>
          </div>
        </div>
        <form className="compact-form roster-inline-form" onSubmit={onSubmit}>
          {error ? <p className="form-error modal-wide">{error}</p> : null}
          <label className="field modal-wide">
            <span>Title</span>
            <input
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              required
              value={draft.title}
            />
          </label>
          <label className="field">
            <span>Type</span>
            <select
              onChange={(event) =>
                setDraft((current) => ({ ...current, meetingType: event.target.value as MeetingPayload["meetingType"] }))
              }
              value={draft.meetingType}
            >
              <option value="general">General</option>
              <option value="build">Build</option>
              <option value="review">Review</option>
              <option value="outreach">Outreach</option>
              <option value="competition">Competition</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="field">
            <span>Project</span>
            <select
              onChange={(event) => {
                const selectedProject = bootstrap.projects.find((project) => project.id === event.target.value);
                setDraft((current) => ({
                  ...current,
                  seasonId: selectedProject?.seasonId ?? current.seasonId,
                  projectIds: event.target.value ? [event.target.value] : [],
                }));
              }}
              value={draft.projectIds[0] ?? ""}
            >
              <option value="">All projects</option>
              {bootstrap.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Start date</span>
            <input
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  startDateTime: combineDateTime(event.target.value, startTime),
                }))
              }
              required
              type="date"
              value={startDate}
            />
          </label>
          <label className="field">
            <span>Start time</span>
            <input
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  startDateTime: combineDateTime(startDate, event.target.value),
                }))
              }
              type="time"
              value={startTime}
            />
          </label>
          <label className="field">
            <span>End date</span>
            <input
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  endDateTime: resolveEndDateTime(event.target.value, endTime),
                }))
              }
              type="date"
              value={endDate}
            />
          </label>
          <label className="field">
            <span>End time</span>
            <input
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  endDateTime: resolveEndDateTime(endDate, event.target.value),
                }))
              }
              type="time"
              value={endTime}
            />
          </label>
          <label className="field modal-wide">
            <span>Location</span>
            <input
              onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))}
              value={draft.location}
            />
          </label>
          <label className="field modal-wide">
            <span>Description</span>
            <textarea
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              rows={3}
              value={draft.description}
            />
          </label>
          <div className="modal-actions modal-wide">
            <button className="secondary-action" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="primary-action" disabled={isSaving || draft.title.trim().length < 2} type="submit">
              {isSaving ? "Saving..." : "Add meeting"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
