import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { BootstrapPayload, TestResultPayload } from "@/types";
import { PhotoUploadField } from "@/features/workspace/shared/PhotoUploadField";

interface EventReportEditorModalProps {
  bootstrap: BootstrapPayload;
  closeEventReportModal: () => void;
  eventReportDraft: TestResultPayload;
  eventReportFindings: string;
  handleEventReportSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSavingEventReport: boolean;
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
  setEventReportDraft: Dispatch<SetStateAction<TestResultPayload>>;
  setEventReportFindings: (value: string) => void;
}

export function EventReportEditorModal({
  bootstrap,
  closeEventReportModal,
  eventReportDraft,
  eventReportFindings,
  handleEventReportSubmit,
  isSavingEventReport,
  requestPhotoUpload,
  setEventReportDraft,
  setEventReportFindings,
}: EventReportEditorModalProps) {
  const selectedEvent = bootstrap.events.find((item) => item.id === eventReportDraft.eventId);
  const eventReportPhotoProjectId =
    selectedEvent?.projectIds[0] ?? bootstrap.projects[0]?.id ?? null;

  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section
        aria-modal="true"
        className="modal-card"
        role="dialog"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}
      >
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>
              Event report
            </p>
            <h2 style={{ color: "var(--text-title)" }}>Add event report</h2>
          </div>
          <button
            className="icon-button"
            onClick={closeEventReportModal}
            style={{ color: "var(--text-copy)", background: "transparent" }}
            type="button"
          >
            Close
          </button>
        </div>
        <form
          className="modal-form"
          onSubmit={handleEventReportSubmit}
          style={{ color: "var(--text-copy)" }}
        >
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Event</span>
            <select
              onChange={(event) =>
                setEventReportDraft((current) => ({
                  ...current,
                  eventId: event.target.value,
                }))
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={eventReportDraft.eventId ?? ""}
            >
              <option disabled value="">
                Choose an event
              </option>
              {bootstrap.events.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            {selectedEvent ? (
              <small style={{ color: "var(--text-copy)" }}>{selectedEvent.description}</small>
            ) : null}
          </label>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Title</span>
            <input
              onChange={(event) =>
                setEventReportDraft((current) => ({
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
              value={eventReportDraft.title ?? ""}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Status</span>
            <select
              onChange={(event) =>
                setEventReportDraft((current) => ({
                  ...current,
                  status: event.target.value as TestResultPayload["status"],
                }))
              }
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={eventReportDraft.status}
            >
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
              <option value="blocked">Blocked</option>
            </select>
          </label>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Findings (one per line)</span>
            <textarea
              onChange={(event) => setEventReportFindings(event.target.value)}
              placeholder="Add findings from this event."
              rows={4}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={eventReportFindings}
            />
          </label>
          <PhotoUploadField
            accept="image/*,video/*"
            currentUrl={eventReportDraft.photoUrl}
            label="Event report media"
            onChange={(value) =>
              setEventReportDraft((current) => ({ ...current, photoUrl: value }))
            }
            onUpload={async (file) => {
              if (!eventReportPhotoProjectId) {
                throw new Error("No project is available for photo upload.");
              }

              return requestPhotoUpload(eventReportPhotoProjectId, file);
            }}
          />
          <div className="modal-actions modal-wide">
            <button
              className="secondary-action"
              onClick={closeEventReportModal}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              type="button"
            >
              Cancel
            </button>
            <button
              className="primary-action"
              disabled={isSavingEventReport || bootstrap.events.length === 0}
              type="submit"
            >
              {isSavingEventReport ? "Saving..." : "Add event report"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
