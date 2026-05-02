import type { Dispatch, FormEvent, SetStateAction } from "react";
import { createPortal } from "react-dom";

import type { BootstrapPayload, EventRecord, EventType } from "@/types";
import { formatDate } from "@/lib/appUtils";
import {
  formatTaskPlanningState,
  getTaskBlocksTasks,
  getTaskOpenBlockersForTask,
  getTaskPlanningState,
  getTaskWaitingOnDependencies,
} from "@/features/workspace/shared/taskPlanning";
import { getStatusPillClassName } from "@/features/workspace/shared";
import { reconcileMilestoneSubsystemIds } from "@/features/workspace/shared/eventProjectUtils";
import { EVENT_TYPE_STYLES } from "@/features/workspace/shared/eventStyles";
import type { TimelineEventDraft } from "@/features/workspace/shared/timelineEventHelpers";

type TaskPlanningState = "blocked" | "at-risk" | "waiting-on-dependency" | "ready" | "overdue";

const EVENT_TYPE_OPTIONS: { id: EventType; name: string }[] = (
  Object.entries(EVENT_TYPE_STYLES) as [EventType, (typeof EVENT_TYPE_STYLES)[EventType]][]
).map(([id, style]) => ({
  id,
  name: style.label,
}));

function MilestoneTaskCard({
  bootstrap,
  task,
}: {
  bootstrap: BootstrapPayload;
  task: BootstrapPayload["tasks"][number];
}) {
  const taskPlanningState = getTaskPlanningState(task, bootstrap);
  const blockers = getTaskOpenBlockersForTask(task.id, bootstrap);
  const waitingOn = getTaskWaitingOnDependencies(task.id, bootstrap);
  const blocks = getTaskBlocksTasks(task.id, bootstrap);

  return (
    <div
      style={{
        display: "grid",
        gap: "0.25rem",
        padding: "0.75rem",
        border: "1px solid var(--border-base)",
        borderRadius: "12px",
        background: "var(--bg-row-alt)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <strong style={{ color: "var(--text-title)" }}>{task.title}</strong>
        <span className={getStatusPillClassName(taskPlanningState)}>
          {formatTaskPlanningState(taskPlanningState)}
        </span>
      </div>
      <small style={{ color: "var(--text-copy)" }}>
        Due {formatDate(task.dueDate)}
        {blockers.length > 0 ? ` · blocked by ${blockers.length}` : ""}
        {waitingOn.length > 0 ? ` · waiting on ${waitingOn.length}` : ""}
        {blocks.length > 0 ? ` · blocks ${blocks.length}` : ""}
      </small>
    </div>
  );
}

interface MilestonesEventModalProps {
  activeEvent: EventRecord | null;
  activeEventCompleteTasks: BootstrapPayload["tasks"];
  activeEventTasks: BootstrapPayload["tasks"];
  bootstrap: BootstrapPayload;
  eventError: string | null;
  eventModalMode: "create" | "edit" | null;
  eventStartDate: string;
  eventStartTime: string;
  eventEndDate: string;
  eventEndTime: string;
  eventTaskGroups: Record<TaskPlanningState, BootstrapPayload["tasks"]>;
  eventTaskOrder: readonly TaskPlanningState[];
  isDeletingEvent: boolean;
  isSavingEvent: boolean;
  milestoneDraft: TimelineEventDraft;
  modalPortalTarget: HTMLElement | null;
  onClose: () => void;
  onDelete: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
  selectableSubsystems: BootstrapPayload["subsystems"];
  setEventEndDate: Dispatch<SetStateAction<string>>;
  setEventEndTime: Dispatch<SetStateAction<string>>;
  setEventStartDate: Dispatch<SetStateAction<string>>;
  setEventStartTime: Dispatch<SetStateAction<string>>;
  setMilestoneDraft: Dispatch<SetStateAction<TimelineEventDraft>>;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
}

export function MilestonesEventModal({
  activeEvent,
  activeEventCompleteTasks,
  activeEventTasks,
  bootstrap,
  eventError,
  eventModalMode,
  eventStartDate,
  eventStartTime,
  eventEndDate,
  eventEndTime,
  eventTaskGroups,
  eventTaskOrder,
  isDeletingEvent,
  isSavingEvent,
  milestoneDraft,
  modalPortalTarget,
  onClose,
  onDelete,
  onSubmit,
  projectsById,
  selectableSubsystems,
  setEventEndDate,
  setEventEndTime,
  setEventStartDate,
  setEventStartTime,
  setMilestoneDraft,
  subsystemsById,
}: MilestonesEventModalProps) {
  if (!eventModalMode || !modalPortalTarget) {
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
        data-tutorial-target={
          eventModalMode === "create" ? "milestone-create-modal" : "milestone-edit-modal"
        }
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}
      >
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>
              Timeline milestone
            </p>
            <h2 style={{ color: "var(--text-title)" }}>
              {eventModalMode === "create" ? "Add milestone" : "Edit milestone"}
            </h2>
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
                setMilestoneDraft((current) => ({
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
              value={milestoneDraft.title}
            />
          </label>

          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Type</span>
            <select
              onChange={(event) =>
                setMilestoneDraft((current) => ({
                  ...current,
                  type: event.target.value as EventType,
                }))
              }
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={milestoneDraft.type}
            >
              {EVENT_TYPE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
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
                setMilestoneDraft((current) => ({
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
              value={milestoneDraft.description}
            />
          </label>

          {eventModalMode === "edit" && activeEvent ? (
            <div className="field modal-wide">
              <span style={{ color: "var(--text-title)" }}>Readiness</span>
              {activeEventTasks.length > 0 ? (
                <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.5rem" }}>
                  {eventTaskOrder.map((state) => {
                    const tasks = eventTaskGroups[state];
                    if (tasks.length === 0) {
                      return null;
                    }

                    return (
                      <section key={state} style={{ display: "grid", gap: "0.5rem" }}>
                        <h3
                          style={{
                            margin: 0,
                            color: "var(--text-title)",
                            fontSize: "0.9rem",
                            textTransform: "capitalize",
                          }}
                        >
                          {formatTaskPlanningState(state)} ({tasks.length})
                        </h3>
                        <div style={{ display: "grid", gap: "0.5rem" }}>
                          {tasks.map((task) => (
                            <MilestoneTaskCard key={task.id} bootstrap={bootstrap} task={task} />
                          ))}
                        </div>
                      </section>
                    );
                  })}
                  {activeEventCompleteTasks.length > 0 ? (
                    <section style={{ display: "grid", gap: "0.5rem" }}>
                      <h3
                        style={{
                          margin: 0,
                          color: "var(--text-title)",
                          fontSize: "0.9rem",
                          textTransform: "capitalize",
                        }}
                      >
                        Complete ({activeEventCompleteTasks.length})
                      </h3>
                      <div style={{ display: "grid", gap: "0.5rem" }}>
                        {activeEventCompleteTasks.map((task) => (
                          <MilestoneTaskCard key={task.id} bootstrap={bootstrap} task={task} />
                        ))}
                      </div>
                    </section>
                  ) : null}
                </div>
              ) : (
                <p style={{ margin: "0.25rem 0 0", color: "var(--text-copy)" }}>
                  No tasks currently target this milestone.
                </p>
              )}
            </div>
          ) : null}

          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Related projects</span>
            <select
              multiple
              onChange={(event) =>
                setMilestoneDraft((current) => {
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

          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Related subsystems</span>
            <select
              multiple
              onChange={(event) =>
                setMilestoneDraft((current) => ({
                  ...current,
                  relatedSubsystemIds: Array.from(
                    event.currentTarget.selectedOptions,
                    (option) => option.value,
                  ),
                }))
              }
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
                minHeight: "7rem",
              }}
              value={milestoneDraft.relatedSubsystemIds}
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

          <label className="field modal-wide" style={{ display: "flex", alignItems: "center" }}>
            <input
              checked={milestoneDraft.isExternal}
              onChange={(event) =>
                setMilestoneDraft((current) => ({
                  ...current,
                  isExternal: event.target.checked,
                }))
              }
              style={{ width: "auto" }}
              type="checkbox"
            />
            <span style={{ color: "var(--text-title)" }}>External milestone/event</span>
          </label>

          {eventError ? (
            <p className="section-copy" style={{ color: "var(--official-red)" }}>
              {eventError}
            </p>
          ) : null}

          <div className="modal-actions modal-wide">
            {eventModalMode === "edit" ? (
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
              {isSavingEvent
                ? "Saving..."
                : eventModalMode === "create"
                  ? "Add milestone"
                  : "Save milestone"}
            </button>
          </div>
        </form>
      </section>
    </div>,
    modalPortalTarget,
  );
}
