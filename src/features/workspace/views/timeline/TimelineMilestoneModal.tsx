import React from "react";
import { createPortal } from "react-dom";
import type { BootstrapPayload, EventRecord, EventType } from "@/types";
import {
  EVENT_TYPE_OPTIONS,
} from "@/features/workspace/shared/eventStyles";
import {
  reconcileMilestoneSubsystemIds,
} from "@/features/workspace/shared/eventProjectUtils";
import type { TimelineEventDraft } from "@/features/workspace/shared/timelineEventHelpers";

interface TimelineMilestoneModalProps {
  activeDayEvents: EventRecord[];
  activeEventDay: string | null;
  bootstrap: BootstrapPayload;
  eventDraft: TimelineEventDraft;
  eventEndDate: string;
  eventEndTime: string;
  eventError: string | null;
  eventStartDate: string;
  eventStartTime: string;
  isDeletingEvent: boolean;
  isSavingEvent: boolean;
  mode: "create" | "edit" | null;
  onClose: () => void;
  onDelete: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onSwitchToTask: () => void;
  portalTarget: HTMLElement | null;
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
  selectableSubsystems: BootstrapPayload["subsystems"];
  setEventDraft: React.Dispatch<React.SetStateAction<TimelineEventDraft>>;
  setEventEndDate: React.Dispatch<React.SetStateAction<string>>;
  setEventEndTime: React.Dispatch<React.SetStateAction<string>>;
  setEventStartDate: React.Dispatch<React.SetStateAction<string>>;
  setEventStartTime: React.Dispatch<React.SetStateAction<string>>;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
}

export const TimelineMilestoneModal: React.FC<TimelineMilestoneModalProps> = ({
  activeDayEvents,
  activeEventDay,
  bootstrap,
  eventDraft,
  eventEndDate,
  eventEndTime,
  eventError,
  eventStartDate,
  eventStartTime,
  isDeletingEvent,
  isSavingEvent,
  mode,
  onClose,
  onDelete,
  onSubmit,
  onSwitchToTask,
  portalTarget,
  projectsById,
  selectableSubsystems,
  setEventDraft,
  setEventEndDate,
  setEventEndTime,
  setEventStartDate,
  setEventStartTime,
  subsystemsById,
}) => {
  if (!mode || !portalTarget) {
    return null;
  }

  return createPortal(
    <div
      className="modal-scrim"
      onClick={onClose}
      role="presentation"
      style={{ zIndex: 2050 }}
    >
      <section
        aria-modal="true"
        className="modal-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--border-base)",
          ...(mode === "create" ? { paddingTop: "0.65rem" } : null),
        }}
      >
        <div
          className="panel-header compact-header"
          style={mode === "create" ? { marginBottom: "0.65rem" } : undefined}
        >
          <div>
            <p
              className="eyebrow"
              style={{
                color: "var(--meco-blue)",
                ...(mode === "create" ? { marginBottom: "0.2rem" } : null),
              }}
            >
              Timeline milestone
            </p>
            {mode === "create" ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                  marginTop: 0,
                }}
              >
                <h2 style={{ color: "var(--text-title)", margin: 0 }}>Create</h2>
                <button className="secondary-action" onClick={onSwitchToTask} type="button">
                  Task
                </button>
                <button className="primary-action" type="button">
                  Milestone
                </button>
              </div>
            ) : (
              <h2 style={{ color: "var(--text-title)" }}>Edit milestone</h2>
            )}
            {activeEventDay ? (
              <p className="section-copy" style={{ marginTop: "0.25rem" }}>
                Date: {activeEventDay}
              </p>
            ) : null}
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            style={{ color: "var(--text-copy)", background: "transparent" }}
            type="button"
          >
            Close
          </button>
        </div>

        <form className="modal-form" onSubmit={onSubmit}>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Title</span>
            <input
              onChange={(event) =>
                setEventDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={eventDraft.title}
            />
          </label>

          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Type</span>
            <select
              onChange={(event) =>
                setEventDraft((current) => ({
                  ...current,
                  type: event.target.value as EventType,
                }))
              }
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={eventDraft.type}
            >
              {EVENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Start date</span>
            <input
              onChange={(event) => setEventStartDate(event.target.value)}
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              type="date"
              value={eventStartDate}
            />
          </label>

          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Start time</span>
            <input
              onChange={(event) => setEventStartTime(event.target.value)}
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              type="time"
              value={eventStartTime}
            />
          </label>

          <label className="field">
            <span style={{ color: "var(--text-title)" }}>End date (optional)</span>
            <input
              onChange={(event) => setEventEndDate(event.target.value)}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              type="date"
              value={eventEndDate}
            />
          </label>

          <label className="field">
            <span style={{ color: "var(--text-title)" }}>End time (optional)</span>
            <input
              onChange={(event) => setEventEndTime(event.target.value)}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              type="time"
              value={eventEndTime}
            />
          </label>

          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Description</span>
            <textarea
              onChange={(event) =>
                setEventDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={3}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={eventDraft.description}
            />
          </label>

          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Related projects</span>
            <select
              multiple
              onChange={(event) =>
                setEventDraft((current) => {
                  const projectIds = Array.from(
                    event.currentTarget.selectedOptions,
                    (option) => option.value,
                  );

                  return {
                    ...current,
                    projectIds,
                    relatedSubsystemIds: reconcileMilestoneSubsystemIds(
                      current.relatedSubsystemIds,
                      projectIds,
                      subsystemsById,
                    ),
                  };
                })
              }
              size={Math.min(bootstrap.projects.length || 1, 6)}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={eventDraft.projectIds}
            >
              {bootstrap.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Related subsystems</span>
            <select
              multiple
              onChange={(event) =>
                setEventDraft((current) => ({
                  ...current,
                  relatedSubsystemIds: Array.from(
                    event.currentTarget.selectedOptions,
                    (option) => option.value,
                  ),
                }))
              }
              size={Math.min(bootstrap.subsystems.length || 1, 6)}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={eventDraft.relatedSubsystemIds}
            >
              {selectableSubsystems.map((subsystem) => (
                <option key={subsystem.id} value={subsystem.id}>
                  {projectsById[subsystem.projectId]?.name
                    ? `${projectsById[subsystem.projectId].name} - ${subsystem.name}`
                    : subsystem.name}
                </option>
              ))}
            </select>
          </label>

          <div className="checkbox-row modal-wide">
            <label className="checkbox-field">
              <input
                checked={eventDraft.isExternal}
                onChange={(event) =>
                  setEventDraft((current) => ({
                    ...current,
                    isExternal: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span style={{ color: "var(--text-title)" }}>External milestone/event</span>
            </label>
          </div>

          {eventError ? (
            <p className="section-copy modal-wide" style={{ color: "var(--official-red)" }}>
              {eventError}
            </p>
          ) : null}

          {mode === "edit" && activeDayEvents.length > 1 ? (
            <p className="section-copy modal-wide">
              {activeDayEvents.length} milestones are scheduled on this day. This editor opened the
              earliest one.
            </p>
          ) : null}

          <div className="modal-actions modal-wide">
            {mode === "edit" ? (
              <button
                className="danger-action"
                disabled={isDeletingEvent || isSavingEvent}
                onClick={onDelete}
                type="button"
              >
                {isDeletingEvent ? "Deleting..." : "Delete milestone"}
              </button>
            ) : null}
            <button
              className="secondary-action"
              disabled={isDeletingEvent || isSavingEvent}
              onClick={onClose}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              type="button"
            >
              Cancel
            </button>
            <button className="primary-action" disabled={isDeletingEvent || isSavingEvent} type="submit">
              {isSavingEvent ? "Saving..." : mode === "create" ? "Add milestone" : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>,
    portalTarget,
  );
};
