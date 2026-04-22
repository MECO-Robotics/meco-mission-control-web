import type { Dispatch, FormEvent, SetStateAction } from "react";
import type {
  BootstrapPayload,
  ManufacturingItemPayload,
  PurchaseItemPayload,
  TaskPayload,
  TaskRecord,
} from "../../types";

interface TaskEditorModalProps {
  activeTask: TaskRecord | null;
  bootstrap: BootstrapPayload;
  closeTaskModal: () => void;
  handleTaskSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSavingTask: boolean;
  mentors: BootstrapPayload["members"];
  students: BootstrapPayload["members"];
  taskDraft: TaskPayload;
  taskDraftBlockers: string;
  taskModalMode: "create" | "edit";
  setTaskDraft: Dispatch<SetStateAction<TaskPayload>>;
  setTaskDraftBlockers: (value: string) => void;
}

export function TaskEditorModal({
  activeTask,
  bootstrap,
  closeTaskModal,
  handleTaskSubmit,
  isSavingTask,
  mentors,
  students,
  taskDraft,
  taskDraftBlockers,
  taskModalMode,
  setTaskDraft,
  setTaskDraftBlockers,
}: TaskEditorModalProps) {
  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section aria-modal="true" className="modal-card" role="dialog" style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}>
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>Task editor</p>
            <h2 style={{ color: "var(--text-title)" }}>{taskModalMode === "create" ? "Create task" : activeTask?.title ?? "Edit task"}</h2>
          </div>
          <button className="icon-button" onClick={closeTaskModal} type="button" style={{ color: "var(--text-copy)", background: "transparent" }}>
            Close
          </button>
        </div>
        <form className="modal-form" onSubmit={handleTaskSubmit} style={{ color: "var(--text-copy)" }}>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Title</span>
            <input
              onChange={(event) =>
                setTaskDraft((current) => ({ ...current, title: event.target.value }))
              }
              required
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={taskDraft.title}
            />
          </label>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Summary</span>
            <textarea
              onChange={(event) =>
                setTaskDraft((current) => ({ ...current, summary: event.target.value }))
              }
              required
              rows={3}
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={taskDraft.summary}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Subsystem</span>
            <select
              onChange={(event) =>
                setTaskDraft((current) => ({ ...current, subsystemId: event.target.value }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={taskDraft.subsystemId}
            >
              {bootstrap.subsystems.map((subsystem) => (
                <option key={subsystem.id} value={subsystem.id}>
                  {subsystem.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Owner</span>
            <select
              onChange={(event) =>
                setTaskDraft((current) => ({
                  ...current,
                  ownerId: event.target.value || null,
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={taskDraft.ownerId ?? ""}
            >
              <option value="">Unassigned</option>
              {students.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Mentor</span>
            <select
              onChange={(event) =>
                setTaskDraft((current) => ({
                  ...current,
                  mentorId: event.target.value || null,
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={taskDraft.mentorId ?? ""}
            >
              <option value="">Unassigned</option>
              {mentors.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Status</span>
            <select
              onChange={(event) =>
                setTaskDraft((current) => ({
                  ...current,
                  status: event.target.value as TaskPayload["status"],
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={taskDraft.status}
            >
              <option value="not-started">Not started</option>
              <option value="in-progress">In progress</option>
              <option value="waiting-for-qa">Waiting for QA</option>
              <option value="complete">Complete</option>
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Priority</span>
            <select
              onChange={(event) =>
                setTaskDraft((current) => ({
                  ...current,
                  priority: event.target.value as TaskPayload["priority"],
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={taskDraft.priority}
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Start date</span>
            <input
              onChange={(event) =>
                setTaskDraft((current) => ({ ...current, startDate: event.target.value }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              type="date"
              value={taskDraft.startDate}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Due date</span>
            <input
              onChange={(event) =>
                setTaskDraft((current) => ({ ...current, dueDate: event.target.value }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              type="date"
              value={taskDraft.dueDate}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Estimated hours</span>
            <input
              min="0"
              onChange={(event) =>
                setTaskDraft((current) => ({
                  ...current,
                  estimatedHours: Number(event.target.value),
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              type="number"
              value={taskDraft.estimatedHours}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Actual hours</span>
            <input
              min="0"
              onChange={(event) =>
                setTaskDraft((current) => ({
                  ...current,
                  actualHours: Number(event.target.value),
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              step="0.5"
              type="number"
              value={taskDraft.actualHours}
            />
          </label>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Blockers</span>
            <input
              onChange={(event) => setTaskDraftBlockers(event.target.value)}
              placeholder="Comma-separated blockers"
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={taskDraftBlockers}
            />
          </label>
          <div className="checkbox-row modal-wide">
            <label className="checkbox-field">
              <input
                checked={taskDraft.requiresDocumentation}
                onChange={(event) =>
                  setTaskDraft((current) => ({
                    ...current,
                    requiresDocumentation: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span style={{ color: "var(--text-title)" }}>Requires documentation</span>
            </label>
            <label className="checkbox-field">
              <input
                checked={taskDraft.documentationLinked}
                onChange={(event) =>
                  setTaskDraft((current) => ({
                    ...current,
                    documentationLinked: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span style={{ color: "var(--text-title)" }}>Documentation linked</span>
            </label>
          </div>
          <div className="modal-actions modal-wide">
            <button className="secondary-action" onClick={closeTaskModal} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} type="button">
              Cancel
            </button>
            <button className="primary-action" disabled={isSavingTask} type="submit">
              {isSavingTask
                ? "Saving..."
                : taskModalMode === "create"
                  ? "Create task"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

interface PurchaseEditorModalProps {
  bootstrap: BootstrapPayload;
  closePurchaseModal: () => void;
  handlePurchaseSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSavingPurchase: boolean;
  purchaseDraft: PurchaseItemPayload;
  purchaseFinalCost: string;
  purchaseModalMode: "create" | "edit";
  setPurchaseDraft: Dispatch<SetStateAction<PurchaseItemPayload>>;
  setPurchaseFinalCost: (value: string) => void;
}

export function PurchaseEditorModal({
  bootstrap,
  closePurchaseModal,
  handlePurchaseSubmit,
  isSavingPurchase,
  purchaseDraft,
  purchaseFinalCost,
  purchaseModalMode,
  setPurchaseDraft,
  setPurchaseFinalCost,
}: PurchaseEditorModalProps) {
  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section aria-modal="true" className="modal-card" role="dialog" style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}>
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>Purchase editor</p>
            <h2 style={{ color: "var(--text-title)" }}>
              {purchaseModalMode === "create"
                ? "Add purchase"
                : "Edit purchase"}
            </h2>
          </div>
          <button className="icon-button" onClick={closePurchaseModal} type="button" style={{ color: "var(--text-copy)", background: "transparent" }}>
            Close
          </button>
        </div>
        <form className="modal-form" onSubmit={handlePurchaseSubmit} style={{ color: "var(--text-copy)" }}>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Title</span>
            <input
              onChange={(event) =>
                setPurchaseDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              required
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={purchaseDraft.title}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Subsystem</span>
            <select
              onChange={(event) =>
                setPurchaseDraft((current) => ({
                  ...current,
                  subsystemId: event.target.value,
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={purchaseDraft.subsystemId}
            >
              {bootstrap.subsystems.map((subsystem) => (
                <option key={subsystem.id} value={subsystem.id}>
                  {subsystem.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Requester</span>
            <select
              onChange={(event) =>
                setPurchaseDraft((current) => ({
                  ...current,
                  requestedById: event.target.value || null,
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={purchaseDraft.requestedById ?? ""}
            >
              <option value="">Unassigned</option>
              {bootstrap.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Vendor</span>
            <input
              onChange={(event) =>
                setPurchaseDraft((current) => ({
                  ...current,
                  vendor: event.target.value,
                }))
              }
              required
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={purchaseDraft.vendor}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Link label</span>
            <input
              onChange={(event) =>
                setPurchaseDraft((current) => ({
                  ...current,
                  linkLabel: event.target.value,
                }))
              }
              required
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={purchaseDraft.linkLabel}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Quantity</span>
            <input
              min="1"
              onChange={(event) =>
                setPurchaseDraft((current) => ({
                  ...current,
                  quantity: Number(event.target.value),
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              type="number"
              value={purchaseDraft.quantity}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Status</span>
            <select
              onChange={(event) =>
                setPurchaseDraft((current) => ({
                  ...current,
                  status: event.target.value as PurchaseItemPayload["status"],
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={purchaseDraft.status}
            >
              <option value="requested">Requested</option>
              <option value="approved">Approved</option>
              <option value="purchased">Purchased</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Estimated cost</span>
            <input
              min="0"
              onChange={(event) =>
                setPurchaseDraft((current) => ({
                  ...current,
                  estimatedCost: Number(event.target.value),
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              type="number"
              value={purchaseDraft.estimatedCost}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Final cost</span>
            <input
              min="0"
              onChange={(event) => setPurchaseFinalCost(event.target.value)}
              placeholder="Optional"
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              type="number"
              value={purchaseFinalCost}
            />
          </label>
          <div className="checkbox-row modal-wide">
            <label className="checkbox-field">
              <input
                checked={purchaseDraft.approvedByMentor}
                onChange={(event) =>
                  setPurchaseDraft((current) => ({
                    ...current,
                    approvedByMentor: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span style={{ color: "var(--text-title)" }}>Mentor approved</span>
            </label>
          </div>
          <div className="modal-actions modal-wide">
            <button className="secondary-action" onClick={closePurchaseModal} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} type="button">
              Cancel
            </button>
            <button className="primary-action" disabled={isSavingPurchase} type="submit">
              {isSavingPurchase
                ? "Saving..."
                : purchaseModalMode === "create"
                  ? "Add purchase"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

interface ManufacturingEditorModalProps {
  bootstrap: BootstrapPayload;
  closeManufacturingModal: () => void;
  handleManufacturingSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSavingManufacturing: boolean;
  manufacturingDraft: ManufacturingItemPayload;
  manufacturingModalMode: "create" | "edit";
  setManufacturingDraft: Dispatch<SetStateAction<ManufacturingItemPayload>>;
}

export function ManufacturingEditorModal({
  bootstrap,
  closeManufacturingModal,
  handleManufacturingSubmit,
  isSavingManufacturing,
  manufacturingDraft,
  manufacturingModalMode,
  setManufacturingDraft,
}: ManufacturingEditorModalProps) {
  const COMMON_MATERIALS = [
    "Aluminum 6061", "Steel 4130", "Polycarbonate",
    "PLA - Black", "PLA - Blue", "PETG", "TPU",
    "Delrin", "Wood"
  ];

  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section aria-modal="true" className="modal-card" role="dialog" style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}>
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>Manufacturing editor</p>
            <h2 style={{ color: "var(--text-title)" }}>
              {manufacturingModalMode === "create"
                ? manufacturingDraft.process === "cnc"
                  ? "Add CNC job"
                  : "Add 3D print job"
                : "Edit manufacturing job"}
            </h2>
          </div>
          <button className="icon-button" onClick={closeManufacturingModal} type="button" style={{ color: "var(--text-copy)", background: "transparent" }}>
            Close
          </button>
        </div>
        <form className="modal-form" onSubmit={handleManufacturingSubmit} style={{ color: "var(--text-copy)" }}>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Title</span>
            <input
              onChange={(event) =>
                setManufacturingDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              required
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={manufacturingDraft.title}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Subsystem</span>
            <select
              onChange={(event) =>
                setManufacturingDraft((current) => ({
                  ...current,
                  subsystemId: event.target.value,
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={manufacturingDraft.subsystemId}
            >
              {bootstrap.subsystems.map((subsystem) => (
                <option key={subsystem.id} value={subsystem.id}>
                  {subsystem.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Requester</span>
            <select
              onChange={(event) =>
                setManufacturingDraft((current) => ({
                  ...current,
                  requestedById: event.target.value || null,
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={manufacturingDraft.requestedById ?? ""}
            >
              <option value="">Unassigned</option>
              {bootstrap.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Process</span>
            <select
              onChange={(event) =>
                setManufacturingDraft((current) => ({
                  ...current,
                  process: event.target.value as ManufacturingItemPayload["process"],
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={manufacturingDraft.process}
            >
              <option value="cnc">CNC</option>
              <option value="3d-print">3D print</option>
              <option value="fabrication">Fabrication</option>
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Due date</span>
            <input
              onChange={(event) =>
                setManufacturingDraft((current) => ({
                  ...current,
                  dueDate: event.target.value,
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              type="date"
              value={manufacturingDraft.dueDate}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Material</span>
            <select
              onChange={(event) =>
                setManufacturingDraft((current) => ({
                  ...current,
                  material: event.target.value,
                }))
              }
              required
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={manufacturingDraft.material}
            >
              <option value="">Select material...</option>
              {COMMON_MATERIALS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Quantity</span>
            <input
              min="1"
              onChange={(event) =>
                setManufacturingDraft((current) => ({
                  ...current,
                  quantity: Number(event.target.value),
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              type="number"
              value={manufacturingDraft.quantity}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Status</span>
            <select
              onChange={(event) =>
                setManufacturingDraft((current) => ({
                  ...current,
                  status: event.target.value as ManufacturingItemPayload["status"],
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={manufacturingDraft.status}
            >
              <option value="requested">Requested</option>
              <option value="approved">Approved</option>
              <option value="in-progress">In progress</option>
              <option value="qa">QA</option>
              <option value="complete">Complete</option>
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Batch label</span>
            <input
              onChange={(event) =>
                setManufacturingDraft((current) => ({
                  ...current,
                  batchLabel: event.target.value,
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              placeholder="Optional"
              value={manufacturingDraft.batchLabel ?? ""}
            />
          </label>
          <div className="checkbox-row modal-wide">
            <label className="checkbox-field">
              <input
                checked={manufacturingDraft.mentorReviewed}
                onChange={(event) =>
                  setManufacturingDraft((current) => ({
                    ...current,
                    mentorReviewed: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span style={{ color: "var(--text-title)" }}>Mentor reviewed</span>
            </label>
          </div>
          <div className="modal-actions modal-wide">
            <button
              className="secondary-action"
              onClick={closeManufacturingModal}
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              type="button"
            >
              Cancel
            </button>
            <button
              className="primary-action"
              disabled={isSavingManufacturing}
              type="submit"
            >
              {isSavingManufacturing
                ? "Saving..."
                : manufacturingModalMode === "create"
                  ? "Add job"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
