import { ReportHistoryList } from "../views/workLogs/ReportHistoryList";
import { ModalDialog } from "@/components/ModalDialog";
import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { TaskDetailsAdvancedSection } from "./task/TaskDetailsAdvancedSection";
import { TaskDetailsDependencyBlockersSection } from "./task/TaskDetailsDependencyBlockersSection";
import { TaskDetailsHeaderSection } from "./task/TaskDetailsHeaderSection";
import { TaskDetailsOverviewSection } from "./task/TaskDetailsOverviewSection";
import type { TaskDetailsEditableField } from "./task/taskModalTypes";
import { WorkspaceAuditActionList } from "../shared/WorkspaceAuditActionList";

interface TaskDetailsModalProps {
  activeTask: TaskRecord;
  bootstrap: BootstrapPayload;
  closeTaskDetailsModal: () => void;
  advancedSectionOpen: boolean;
  beforeOverviewContent?: ReactNode;
  beforeFooterContent?: ReactNode;
  dependencyTargetProjectId?: string | null;
  editableMemberOptions?: BootstrapPayload["members"];
  eyebrowLabel?: string;
  footerActions?: ReactNode;
  headerTitle?: ReactNode;
  modalClassName?: string;
  setTaskDraft?: Dispatch<SetStateAction<TaskPayload>>;
  setAdvancedSectionOpen: Dispatch<SetStateAction<boolean>>;
  taskDraft?: TaskPayload;
  onEditTask: (task: TaskRecord) => void;
  onLogWork?: (taskId: string) => void;
  onSubmitQa?: (taskId: string) => void;
  onResolveTaskBlocker: (blockerId: string) => Promise<void>;
  showDependencyBlockersSection?: boolean;
  showEditButton?: boolean;
}

export function TaskDetailsModal({
  activeTask,
  bootstrap,
  closeTaskDetailsModal,
  advancedSectionOpen,
  beforeOverviewContent,
  beforeFooterContent,
  dependencyTargetProjectId,
  editableMemberOptions,
  eyebrowLabel,
  footerActions,
  headerTitle,
  modalClassName,
  setTaskDraft,
  setAdvancedSectionOpen,
  taskDraft,
  onEditTask,
  onLogWork,
  onSubmitQa,
  onResolveTaskBlocker,
  showDependencyBlockersSection = true,
  showEditButton = true,
}: TaskDetailsModalProps) {
  const [editingField, setEditingField] = useState<TaskDetailsEditableField | null>(null);
  const canInlineEdit = Boolean(taskDraft && setTaskDraft);
  const taskAuditActions = (bootstrap.actions ?? []).filter(
    (action) =>
      action.taskId === activeTask.id ||
      (action.entityType === "task" && action.entityId === activeTask.id) ||
      (Boolean(activeTask.targetRiskId) &&
        action.entityType === "risk" &&
        action.entityId === activeTask.targetRiskId),
  );

  useEffect(() => {
    setEditingField(null);
  }, [activeTask.id]);

  const openTaskEditModal = () => onEditTask(activeTask);

  return (
    <ModalDialog label={typeof headerTitle === "string" ? headerTitle : activeTask.title} onClose={closeTaskDetailsModal}>
      <section
        className={`modal-card task-details-modal${modalClassName ? ` ${modalClassName}` : ""}`}
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}
      >
        <TaskDetailsHeaderSection
          activeTask={activeTask}
          bootstrap={bootstrap}
          canInlineEdit={canInlineEdit}
          closeTaskDetailsModal={closeTaskDetailsModal}
          eyebrowLabel={eyebrowLabel}
          editingField={editingField}
          headerTitle={headerTitle}
          openTaskEditModal={openTaskEditModal}
          setEditingField={setEditingField}
          setTaskDraft={setTaskDraft}
          taskDraft={taskDraft}
        />

        <div className="modal-form task-details-grid" style={{ color: "var(--text-copy)" }}>
          {beforeOverviewContent}

          <TaskDetailsOverviewSection
            activeTask={activeTask}
            bootstrap={bootstrap}
            canInlineEdit={canInlineEdit}
            editableMemberOptions={editableMemberOptions}
            editingField={editingField}
            openTaskEditModal={openTaskEditModal}
            setEditingField={setEditingField}
            setTaskDraft={setTaskDraft}
            taskDraft={taskDraft}
          />

          {showDependencyBlockersSection ? (
            <TaskDetailsDependencyBlockersSection
              activeTask={activeTask}
              bootstrap={bootstrap}
              canInlineEdit={canInlineEdit}
              dependencyTargetProjectId={dependencyTargetProjectId}
              onResolveTaskBlocker={onResolveTaskBlocker}
              setTaskDraft={setTaskDraft}
              taskDraft={taskDraft}
            />
          ) : null}

          <TaskDetailsAdvancedSection
            activeTask={activeTask}
            bootstrap={bootstrap}
            advancedSectionOpen={advancedSectionOpen}
            canInlineEdit={canInlineEdit}
            editingField={editingField}
            openTaskEditModal={openTaskEditModal}
            setAdvancedSectionOpen={setAdvancedSectionOpen}
            setEditingField={setEditingField}
            setTaskDraft={setTaskDraft}
            taskDraft={taskDraft}
          />

          {!canInlineEdit ? <section className="modal-wide"><h3>Work history</h3>
            {bootstrap.workLogs.filter((log) => log.taskId === activeTask.id).length ? <ul>{bootstrap.workLogs.filter((log) => log.taskId === activeTask.id).sort((a, b) => b.date.localeCompare(a.date)).map((log) => <li key={log.id}><details><summary>{log.date} · {log.hours}h · {log.participantIds.map((id) => bootstrap.members.find((member) => member.id === id)?.name ?? "Unknown member").join(", ")}</summary><p>{log.notes || "No notes."}</p>{log.photoUrl ? <a href={log.photoUrl} target="_blank" rel="noreferrer">View work evidence</a> : null}</details></li>)}</ul> : <p className="muted-copy">No work logged yet.</p>}
          </section> : null}
          {!canInlineEdit ? <section className="modal-wide"><h3>QA history</h3><ReportHistoryList reports={bootstrap.qaReports.filter((report) => report.taskId === activeTask.id)} bootstrap={bootstrap} /></section> : null}

          <WorkspaceAuditActionList
            actions={taskAuditActions}
            emptyText="No task or risk reassessment audit actions are recorded yet."
          />

          {beforeFooterContent}

          <div className="modal-actions modal-wide">
            {footerActions}
            {onLogWork ? <button className="secondary-action" type="button" onClick={() => onLogWork(activeTask.id)}>Log work</button> : null}
            {onSubmitQa ? <button className="secondary-action" type="button" onClick={() => onSubmitQa(activeTask.id)}>Submit QA</button> : null}
            {showEditButton ? (
              <button
                className="primary-action task-details-edit-button"
                data-tutorial-target="timeline-edit-task-button"
                onClick={() => onEditTask(activeTask)}
                type="button"
              >
                <svg aria-hidden="true" viewBox="0 0 16 16">
                  <path
                    d="M11.854 1.646a.5.5 0 0 1 .707 0l1.793 1.793a.5.5 0 0 1 0 .707l-8.52 8.52-3.183.71.71-3.183 8.493-8.547ZM3.74 10.995l1.265-.282 7.574-7.6-1.06-1.06-7.6 7.574-.179.81ZM2 13.5h12a.5.5 0 0 1 0 1H2a.5.5 0 0 1 0-1Z"
                    fill="currentColor"
                  />
                </svg>
                Edit task
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </ModalDialog>
  );
}
