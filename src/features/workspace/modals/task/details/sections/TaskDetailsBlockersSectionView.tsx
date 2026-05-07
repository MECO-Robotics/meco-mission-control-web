import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads";
import { IconTrash } from "@/components/shared/Icons";
import { TaskDetailReveal } from "../TaskDetailReveal";
import { useTaskDetailsBlockersSectionModel } from "./useTaskDetailsBlockersSectionModel";
import { TaskDetailsBlockerAddMenu } from "./TaskDetailsBlockerAddMenu";

interface TaskDetailsBlockersSectionViewProps {
  activeTaskId: string;
  bootstrap: BootstrapPayload;
  canInlineEdit: boolean;
  collapsibleOpen?: boolean;
  onCollapsibleToggle?: (open: boolean) => void;
  onResolveTaskBlocker: (blockerId: string) => Promise<void>;
  setTaskDraft?: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft?: TaskPayload;
}

export function TaskDetailsBlockersSectionView(props: TaskDetailsBlockersSectionViewProps) {
  const {
    activeTaskId,
    bootstrap,
    canInlineEdit,
    collapsibleOpen,
    onCollapsibleToggle,
    onResolveTaskBlocker,
    setTaskDraft,
    taskDraft,
  } = props;
  const [editingBlockerKey, setEditingBlockerKey] = useState<string | null>(null);
  const [internalOpen, setInternalOpen] = useState(true);
  const model = useTaskDetailsBlockersSectionModel({
    activeTaskId,
    bootstrap,
    onResolveTaskBlocker,
    setTaskDraft,
    taskDraft,
  });

  useEffect(() => {
    setEditingBlockerKey(null);
  }, [activeTaskId]);

  useEffect(() => {
    setInternalOpen(true);
  }, [activeTaskId]);

  const isOpen = collapsibleOpen ?? internalOpen;

  return (
    <div className="task-detail-blocker-split-column task-detail-collapsible-field">
      <details
        className="task-detail-collapsible"
        open={isOpen}
        onToggle={(milestone) => {
          const nextOpen = milestone.currentTarget.open;
          setInternalOpen(nextOpen);
          onCollapsibleToggle?.(nextOpen);
        }}
      >
        <summary className="task-detail-collapsible-summary task-detail-collapsible-summary-inline">
          <span className="task-detail-collapsible-summary-main">
            <span className="task-detail-collapsible-icon" aria-hidden="true"></span>
            <span className="task-detail-copy">Blockers</span>
          </span>
          {canInlineEdit ? (
            <TaskDetailsBlockerAddMenu
              className="task-details-blocker-add-menu"
              onAddBlocker={model.addBlockerDraft}
            />
          ) : null}
        </summary>
        <div className="task-detail-collapsible-body">
          {canInlineEdit ? (
            <div className="task-details-blocker-editor">
              {model.blockerDrafts.length > 0 ? (
                model.blockerDrafts.map((blocker, index) => {
                  const blockerKey = blocker.id ?? `blocker-${index}`;
                  const isEditing = editingBlockerKey === blockerKey;

                  return isEditing ? (
                    <div
                      className="workspace-detail-list-item task-detail-list-item task-details-dependency-row task-details-dependency-row-with-delete task-details-blocker-row-edit"
                      key={blockerKey}
                    >
                      <button
                        aria-label={`Remove blocker ${index + 1}`}
                        className="icon-button task-details-dependency-row-remove-button"
                        onClick={() => {
                          model.removeBlockerDraft(blockerKey);
                          setEditingBlockerKey((current) => (current === blockerKey ? null : current));
                        }}
                        type="button"
                      >
                        <IconTrash />
                      </button>
                      <input
                        autoFocus
                        aria-label={`Blocker note ${index + 1}`}
                        className="task-detail-inline-edit-input task-details-blocker-input task-details-blocker-row-input"
                        onBlur={() => setEditingBlockerKey(null)}
                        onChange={(milestone) =>
                          model.updateBlockerDraft(blockerKey, { description: milestone.target.value })
                        }
                        placeholder="Describe blocker"
                        value={blocker.description}
                      />
                    </div>
                  ) : (
                    <div
                      className="workspace-detail-list-item task-detail-list-item task-details-dependency-row task-details-dependency-row-with-delete"
                      key={blockerKey}
                    >
                      <button
                        aria-label={`Remove blocker ${index + 1}`}
                        className="icon-button task-details-dependency-row-remove-button"
                        onClick={() => model.removeBlockerDraft(blockerKey)}
                        type="button"
                      >
                        <IconTrash />
                      </button>
                      <button
                        className="task-details-dependency-row-button task-details-blocker-row-button"
                        onClick={() => setEditingBlockerKey(blockerKey)}
                        type="button"
                      >
                        <TaskDetailReveal
                          className="task-detail-ellipsis-reveal"
                          style={{ color: "var(--text-title)", fontWeight: 800 }}
                          text={blocker.description || "Describe blocker"}
                        />
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="task-detail-copy task-detail-empty" style={{ margin: "0.25rem 0 0" }}>
                  No blockers yet
                </p>
              )}
            </div>
          ) : model.openBlockers.length > 0 ? (
              <div className="workspace-detail-list task-detail-list" style={{ marginTop: "0.5rem" }}>
                {model.openBlockers.map((blocker) => (
                  <div className="workspace-detail-list-item task-detail-list-item task-details-blocker-list-item" key={blocker.id}>
                    <div className="task-details-blocker-row-content">
                      <TaskDetailReveal
                        className="task-detail-ellipsis-reveal"
                        style={{ color: "var(--text-title)", fontWeight: 800 }}
                        text={blocker.description}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="task-detail-copy task-detail-empty" style={{ margin: "0.25rem 0 0" }}>
                None
              </p>
            )}
        </div>
      </details>
    </div>
  );
}
