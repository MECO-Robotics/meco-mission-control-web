import { EventReportEditorModal, QaReportEditorModal, WorkLogEditorModal } from "../WorkspaceModals";
import type { WorkspaceModalHostViewProps } from "./workspaceModalHostViewTypes";

export function WorkspaceReportModalsSection(props: WorkspaceModalHostViewProps) {
  if (!props.workLogModalMode && !props.qaReportModalMode && !props.eventReportModalMode) {
    return null;
  }

  return (
    <>
      {props.workLogModalMode ? (
        <WorkLogEditorModal
          bootstrap={props.bootstrap}
          closeWorkLogModal={props.closeWorkLogModal}
          handleWorkLogSubmit={props.handleWorkLogSubmit}
          isSavingWorkLog={props.isSavingWorkLog}
          requestPhotoUpload={props.requestPhotoUpload}
          setWorkLogDraft={props.setWorkLogDraft}
          workLogDraft={props.workLogDraft}
        />
      ) : null}

      {props.qaReportModalMode ? (
        <QaReportEditorModal
          bootstrap={props.bootstrap}
          closeQaReportModal={props.closeQaReportModal}
          handleQaReportSubmit={props.handleQaReportSubmit}
          isSavingQaReport={props.isSavingQaReport}
          requestPhotoUpload={props.requestPhotoUpload}
          qaReportDraft={props.qaReportDraft}
          setQaReportDraft={props.setQaReportDraft}
        />
      ) : null}

      {props.eventReportModalMode ? (
        <EventReportEditorModal
          bootstrap={props.bootstrap}
          closeEventReportModal={props.closeEventReportModal}
          eventReportDraft={props.eventReportDraft}
          eventReportFindings={props.eventReportFindings}
          handleEventReportSubmit={props.handleEventReportSubmit}
          isSavingEventReport={props.isSavingEventReport}
          requestPhotoUpload={props.requestPhotoUpload}
          setEventReportDraft={props.setEventReportDraft}
          setEventReportFindings={props.setEventReportFindings}
        />
      ) : null}
    </>
  );
}
