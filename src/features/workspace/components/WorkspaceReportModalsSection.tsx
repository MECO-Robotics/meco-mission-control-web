import { MilestoneReportEditorModal } from "../modals/workReports/EventReportEditorModal";
import { QaReportEditorModal } from "../modals/workReports/QaReportEditorModal";
import { WorkLogEditorModal } from "../modals/workReports/WorkLogEditorModal";
import type { WorkspaceModalHostViewProps } from "./workspaceModalHostViewTypes";

export function WorkspaceReportModalsSection(props: WorkspaceModalHostViewProps) {
  if (!props.workLogModalMode && !props.qaReportModalMode && !props.milestoneReportModalMode) {
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

      {props.milestoneReportModalMode ? (
        <MilestoneReportEditorModal
          bootstrap={props.bootstrap}
          closeMilestoneReportModal={props.closeMilestoneReportModal}
          milestoneReportDraft={props.milestoneReportDraft}
          milestoneReportFindings={props.milestoneReportFindings}
          handleMilestoneReportSubmit={props.handleMilestoneReportSubmit}
          isSavingMilestoneReport={props.isSavingMilestoneReport}
          requestPhotoUpload={props.requestPhotoUpload}
          setMilestoneReportDraft={props.setMilestoneReportDraft}
          setMilestoneReportFindings={props.setMilestoneReportFindings}
        />
      ) : null}
    </>
  );
}
