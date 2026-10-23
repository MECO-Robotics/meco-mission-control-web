import { EditorModalShell } from "@/features/workspace/modals/EditorModalShell";
import { useEffect, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import type { MaterialPayload, MaterialTransactionPayload } from "@/types/payloads";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MaterialTransactionRecord } from "@/types/recordsInventory";
import { PhotoUploadField } from "@/features/workspace/shared/media/PhotoUploadField";

interface MaterialEditorModalProps {
  closeMaterialModal: () => void;
  handleDeleteMaterial: (id: string) => void;
  handleMaterialSubmit: (milestone: FormEvent<HTMLFormElement>) => void;
  isDeletingMaterial: boolean;
  isSavingMaterial: boolean;
  materialDraft: MaterialPayload;
  materialModalMode: "create" | "edit" | null;
  activeMaterialId: string | null;
  setMaterialDraft: Dispatch<SetStateAction<MaterialPayload>>;
  bootstrap: BootstrapPayload;
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
  handleMaterialTransaction: (payload: MaterialTransactionPayload) => Promise<boolean>;
  materialTransactions: MaterialTransactionRecord[];
}

export function MaterialEditorModal({
  closeMaterialModal,
  handleDeleteMaterial,
  handleMaterialSubmit,
  isDeletingMaterial,
  isSavingMaterial,
  materialDraft,
  materialModalMode,
  activeMaterialId,
  setMaterialDraft,
  bootstrap,
  requestPhotoUpload,
  handleMaterialTransaction,
  materialTransactions,
}: MaterialEditorModalProps) {
  const [movementType, setMovementType] = useState<"consumption" | "adjustment">("consumption");
  const [adjustmentDirection, setAdjustmentDirection] = useState<"increase" | "decrease">("increase");
  const [transactionQuantity, setTransactionQuantity] = useState("");
  const [transactionReason, setTransactionReason] = useState("");
  const [taskId, setTaskId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [isRecordingTransaction, setIsRecordingTransaction] = useState(false);
  useEffect(() => {
    setMovementType("consumption");
    setAdjustmentDirection("increase");
    setTransactionQuantity("");
    setTransactionReason("");
    setTaskId("");
    setProjectId("");
    setIsRecordingTransaction(false);
  }, [activeMaterialId, materialModalMode]);
  if (!materialModalMode) return null;
  const updateDraft = <K extends keyof MaterialPayload>(field: K, value: MaterialPayload[K]) =>
    setMaterialDraft((current) => ({ ...current, [field]: value }));

  return (
    <EditorModalShell
      dialogLabel="Material editor"
      eyebrowLabel="Material editor"
      title={materialModalMode === "create" ? "Add material" : "Edit material"}
      onClose={closeMaterialModal}
      onSubmit={handleMaterialSubmit}
    >
      <label className="field modal-wide">
        <span style={{ color: "var(--text-title)" }}>Name</span>
        <input
          onChange={(event) => updateDraft("name", event.target.value)}
          required
          value={materialDraft.name}
        />
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Category</span>
        <select
          onChange={(event) => updateDraft("category", event.target.value as MaterialPayload["category"])}
          value={materialDraft.category}
        >
          <option value="metal">Metal</option>
          <option value="plastic">Plastic</option>
          <option value="filament">Filament</option>
          <option value="electronics">Electronics</option>
          <option value="hardware">Hardware</option>
          <option value="consumable">Consumable</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Reorder point</span>
        <input
          min="0"
          onChange={(event) => updateDraft("reorderPoint", event.target.value === "" ? null : Number(event.target.value))}
          type="number"
          value={materialDraft.reorderPoint ?? ""}
        />
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Location</span>
        <input
          onChange={(event) => updateDraft("location", event.target.value)}
          value={materialDraft.location}
        />
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Preferred vendor</span>
        <select onChange={(event) => updateDraft("preferredVendorId", event.target.value || null)} value={materialDraft.preferredVendorId ?? ""}>
          <option value="">No preferred vendor</option>
          {bootstrap.vendors.filter((vendor) => !vendor.isArchived).map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
        </select>
      </label>
      <label className="field modal-wide">
        <span style={{ color: "var(--text-title)" }}>Notes</span>
        <textarea
          onChange={(event) => updateDraft("notes", event.target.value)}
          rows={3}
          value={materialDraft.notes}
        />
      </label>
      <PhotoUploadField
        currentUrl={materialDraft.photoUrl ?? ""}
        label="Material photo"
        onChange={(value) => setMaterialDraft((current) => ({ ...current, photoUrl: value }))}
        onUpload={(file) => {
          const projectId = bootstrap.projects[0]?.id;
          if (!projectId) return Promise.reject(new Error("No project is available for photo upload."));
          return requestPhotoUpload(projectId, file);
        }}
      />
      {materialModalMode === "edit" && activeMaterialId ? (
        <section className="field modal-wide" aria-label="Stock transactions">
          <h3 className="task-details-section-title">Stock transactions</h3>
          <p className="muted-copy">Current balance: {bootstrap.materials.find((material) => material.id === activeMaterialId)?.onHandQuantity ?? "Unknown"} {materialDraft.unit}</p>
          <div className="field">
            <label className="field">
              <span style={{ color: "var(--text-title)" }}>Movement</span>
              <select value={movementType} onChange={(event) => setMovementType(event.target.value as typeof movementType)}>
                <option value="consumption">Consume stock</option>
                <option value="adjustment">Adjust stock</option>
              </select>
            </label>
            {movementType === "adjustment" ? (
              <label className="field">
                <span style={{ color: "var(--text-title)" }}>Adjustment</span>
                <select value={adjustmentDirection} onChange={(event) => setAdjustmentDirection(event.target.value as typeof adjustmentDirection)}>
                  <option value="increase">Increase</option>
                  <option value="decrease">Decrease</option>
                </select>
              </label>
            ) : null}
            <label className="field">
              <span style={{ color: "var(--text-title)" }}>Quantity ({materialDraft.unit})</span>
              <input min="0.000001" step="any" type="number" value={transactionQuantity} onChange={(event) => setTransactionQuantity(event.target.value)} />
            </label>
            <label className="field">
              <span style={{ color: "var(--text-title)" }}>Task (optional)</span>
              <select value={taskId} onChange={(event) => setTaskId(event.target.value)}>
                <option value="">No task</option>
                {bootstrap.tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
              </select>
            </label>
            <label className="field">
              <span style={{ color: "var(--text-title)" }}>Project (optional)</span>
              <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
                <option value="">No project</option>
                {bootstrap.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </label>
            <label className="field modal-wide">
              <span style={{ color: "var(--text-title)" }}>Reason</span>
              <input maxLength={500} value={transactionReason} onChange={(event) => setTransactionReason(event.target.value)} />
            </label>
            {(movementType === "consumption" || (movementType === "adjustment" && adjustmentDirection === "decrease")) && bootstrap.materials.find((material) => material.id === activeMaterialId)?.onHandQuantity === null ? <p className="muted-copy modal-wide">Decreasing stock is unavailable until the on-hand quantity is known. Record a count reconciliation after this pass.</p> : null}
            <div className="modal-actions modal-wide">
              <button
                className="secondary-action"
                disabled={isRecordingTransaction || !Number.isFinite(Number(transactionQuantity)) || Number(transactionQuantity) <= 0 || !transactionReason.trim() || ((movementType === "consumption" || (movementType === "adjustment" && adjustmentDirection === "decrease")) && bootstrap.materials.find((material) => material.id === activeMaterialId)?.onHandQuantity === null)}
                onClick={async () => {
                if (!activeMaterialId || isRecordingTransaction) return;
                setIsRecordingTransaction(true);
                const payload: MaterialTransactionPayload = {
                  operationId: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  movementType,
                  quantity: Number(transactionQuantity),
                  ...(movementType === "adjustment" ? { adjustmentDirection } : {}),
                  reason: transactionReason.trim(),
                  ...(taskId ? { taskId } : {}),
                  ...(projectId ? { projectId } : {}),
                };
                try {
                  const recorded = await handleMaterialTransaction(payload);
                  if (recorded) {
                    setTransactionQuantity("");
                    setTransactionReason("");
                  }
                } finally {
                  setIsRecordingTransaction(false);
                }
                }}
                type="button"
              >
                {isRecordingTransaction ? "Recording…" : "Record transaction"}
              </button>
            </div>
          </div>
          <ul className="workspace-record-list" aria-label="Material transaction history">
            {materialTransactions.filter((transaction) => transaction.materialId === activeMaterialId).sort((left, right) => right.recordedAt.localeCompare(left.recordedAt)).map((transaction) => {
              const actor = bootstrap.members.find((member) => member.id === transaction.actorMemberId)?.name ?? (transaction.actorMemberId ? "Former member" : "System");
              const linkedTask = transaction.taskId ? bootstrap.tasks.find((task) => task.id === transaction.taskId)?.title : null;
              const linkedProject = transaction.projectId ? bootstrap.projects.find((project) => project.id === transaction.projectId)?.name : null;
              const linkedPurchase = transaction.purchaseItemId ? bootstrap.purchaseItems.find((item) => item.id === transaction.purchaseItemId)?.title : null;
              const amount = transaction.quantityDelta === null ? "Unknown quantity" : `${transaction.quantityDelta > 0 ? "+" : ""}${transaction.quantityDelta} ${materialDraft.unit}`;
              return <li key={transaction.id}><strong>{amount}</strong> · {transaction.movementType} · {transaction.reason} · {new Date(transaction.recordedAt).toLocaleString()} · {actor}{linkedTask ? ` · Task: ${linkedTask}` : ""}{linkedProject ? ` · Project: ${linkedProject}` : ""}{linkedPurchase ? ` · Purchase: ${linkedPurchase}` : ""}</li>;
            })}
            {materialTransactions.every((transaction) => transaction.materialId !== activeMaterialId) ? <li className="muted-copy">No stock transactions recorded.</li> : null}
          </ul>
        </section>
      ) : null}
      <div className="modal-actions modal-wide">
        {materialModalMode === "edit" && activeMaterialId ? (
          <button
            className="danger-action"
            disabled={isDeletingMaterial || isSavingMaterial}
            onClick={() => handleDeleteMaterial(activeMaterialId)}
            type="button"
          >
            {isDeletingMaterial ? "Deleting..." : "Delete material"}
          </button>
        ) : null}
        <button
          className="secondary-action"
          onClick={closeMaterialModal}
          type="button"
        >
          Cancel
        </button>
        <button className="primary-action" disabled={isSavingMaterial} type="submit">
          {isSavingMaterial ? "Saving..." : materialModalMode === "create" ? "Add material" : "Save changes"}
        </button>
      </div>
    </EditorModalShell>
  );
}
