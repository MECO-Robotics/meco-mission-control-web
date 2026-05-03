import type { Dispatch, SetStateAction } from "react";
import type { BootstrapPayload, TaskPayload } from "@/types";
import { IconPlus, IconTrash } from "@/components/shared/Icons";
import { TaskDetailReveal } from "../TaskDetailReveal";
import { useTaskDetailsBlockersSectionModel } from "./useTaskDetailsBlockersSectionModel";

interface TaskDetailsBlockersSectionViewProps {
  activeTaskId: string;
  bootstrap: BootstrapPayload;
  canInlineEdit: boolean;
  onResolveTaskBlocker: (blockerId: string) => Promise<void>;
  setTaskDraft?: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft?: TaskPayload;
}

export function TaskDetailsBlockersSectionView(props: TaskDetailsBlockersSectionViewProps) {
  const {
    activeTaskId,
    bootstrap,
    canInlineEdit,
    onResolveTaskBlocker,
    setTaskDraft,
    taskDraft,
  } = props;
  const model = useTaskDetailsBlockersSectionModel({
    activeTaskId,
    bootstrap,
    onResolveTaskBlocker,
    setTaskDraft,
    taskDraft,
  });

  return (
    <div className="task-detail-blocker-split-column task-detail-collapsible-field">
      <details className="task-detail-collapsible" open>
        <summary className="task-detail-collapsible-summary task-detail-collapsible-summary-inline">
          <span className="task-detail-collapsible-summary-main">
            <span className="task-detail-collapsible-icon" aria-hidden="true"></span>
            <span className="task-detail-copy">Blockers</span>
          </span>
          {canInlineEdit ? (
            <button
              aria-label="Add blocker"
              className="icon-button task-detail-section-action-button"
              onClick={() => model.addBlockerDraft()}
              type="button"
            >
              <IconPlus />
            </button>
          ) : null}
        </summary>
        <div className="task-detail-collapsible-body">
          {canInlineEdit ? (
            <div className="task-details-blocker-editor">
              {model.blockerDrafts.length > 0 ? (
                model.blockerDrafts.map((blocker, index) => (
                  <div className="task-details-blocker-editor-row" key={blocker.id ?? `blocker-${index}`}>
                    <input
                      aria-label={`Blocker note ${index + 1}`}
                      className="task-detail-inline-edit-input task-details-blocker-input"
                      onChange={(milestone) =>
                        model.updateBlockerDraft(index, { description: milestone.target.value })
                      }
                      placeholder="Describe blocker"
                      value={blocker.description}
                    />
                    <button
                      aria-label={`Remove blocker ${index + 1}`}
                      className="icon-button task-details-draft-remove-button"
                      onClick={() => model.removeBlockerDraft(index)}
                      type="button"
                    >
                      <IconTrash />
                    </button>
                  </div>
                ))
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
