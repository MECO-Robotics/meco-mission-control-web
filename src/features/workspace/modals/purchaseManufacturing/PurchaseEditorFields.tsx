import type { Dispatch, SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { PurchaseItemPayload } from "@/types/payloads";

interface PurchaseEditorFieldsProps {
  bootstrap: BootstrapPayload;
  purchaseDraft: PurchaseItemPayload;
  purchaseFinalCost: string;
  setPurchaseDraft: Dispatch<SetStateAction<PurchaseItemPayload>>;
  setPurchaseFinalCost: (value: string) => void;
}

function newQuoteId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `quote-${Date.now()}`;
}

export function PurchaseEditorFields({ bootstrap, purchaseDraft, purchaseFinalCost, setPurchaseDraft, setPurchaseFinalCost }: PurchaseEditorFieldsProps) {
  const selectedQuote = purchaseDraft.quotes.find((quote) => quote.id === purchaseDraft.selectedQuoteId) ?? null;
  const updateQuote = (patch: Partial<NonNullable<typeof selectedQuote>>) => setPurchaseDraft((current) => {
    const existing = current.quotes.find((quote) => quote.id === current.selectedQuoteId);
    if (!existing) {
      const quote = { id: newQuoteId(), vendorId: "", reference: null, amount: null, quotedAt: null, ...patch };
      return { ...current, quotes: [...current.quotes, quote], selectedQuoteId: quote.id };
    }
    return { ...current, quotes: current.quotes.map((quote) => quote.id === existing.id ? { ...quote, ...patch } : quote) };
  });

  return <>
    <label className="field modal-wide"><span>Procurement Task</span><select required value={purchaseDraft.taskId} onChange={(event) => setPurchaseDraft((current) => ({ ...current, taskId: event.target.value }))}><option value="">Select the human work item</option>{bootstrap.tasks.map((task) => <option key={task.id} value={task.id}>{task.title} — {bootstrap.projects.find((project) => project.id === task.projectId)?.name ?? "Project"}</option>)}</select><small>Purchasing records commercial state. The associated Task owns the human procurement work.</small></label>
    <label className="field"><span>Acquisition</span><select value={purchaseDraft.kind} onChange={(event) => setPurchaseDraft((current) => ({ ...current, kind: event.target.value as PurchaseItemPayload["kind"] }))}><option value="cots-goods">COTS goods</option><option value="manufacturing-service">Outsourced manufacturing service</option></select></label>
    <label className="field"><span>Quantity</span><input min="1" type="number" value={purchaseDraft.quantity} onChange={(event) => setPurchaseDraft((current) => ({ ...current, quantity: Number(event.target.value) }))} /></label>
    <label className="field modal-wide"><span>Line title</span><input required value={purchaseDraft.title} onChange={(event) => setPurchaseDraft((current) => ({ ...current, title: event.target.value }))} /></label>
    <label className="field"><span>Part definition</span><select value={purchaseDraft.partDefinitionId ?? ""} onChange={(event) => setPurchaseDraft((current) => ({ ...current, partDefinitionId: event.target.value || null }))}><option value="">Not linked to a part definition</option>{bootstrap.partDefinitions.map((part) => <option key={part.id} value={part.id}>{part.partNumber} — {part.name} (Rev {part.revision})</option>)}</select></label>
    <label className="field"><span>Material</span><select value={purchaseDraft.materialId ?? ""} onChange={(event) => setPurchaseDraft((current) => ({ ...current, materialId: event.target.value || null }))}><option value="">Not linked to material stock</option>{bootstrap.materials.map((material) => <option key={material.id} value={material.id}>{material.name}</option>)}</select></label>
    <label className="field"><span>Quote vendor</span><select value={selectedQuote?.vendorId ?? ""} onChange={(event) => updateQuote({ vendorId: event.target.value, quotedAt: new Date().toISOString() })}><option value="">No quote selected</option>{bootstrap.vendors.filter((vendor) => !vendor.isArchived).map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select></label>
    <label className="field"><span>Quote reference</span><input value={selectedQuote?.reference ?? ""} onChange={(event) => updateQuote({ reference: event.target.value || null })} /></label>
    <label className="field"><span>Quote amount (USD)</span><input min="0" step="0.01" type="number" value={selectedQuote?.amount?.amount ?? ""} onChange={(event) => updateQuote({ amount: event.target.value ? { amount: Number(event.target.value), currency: "USD" } : null })} /></label>
    <label className="field"><span>Quote URL</span><input type="url" value={selectedQuote?.url ?? ""} onChange={(event) => updateQuote({ url: event.target.value || undefined })} /></label>
    <label className="field"><span>Approval</span><select value={purchaseDraft.approvalStatus} onChange={(event) => setPurchaseDraft((current) => ({ ...current, approvalStatus: event.target.value as PurchaseItemPayload["approvalStatus"], approvedAt: event.target.value === "approved" ? new Date().toISOString() : null }))}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label>
    <label className="field"><span>Approved by</span><select value={purchaseDraft.approvedById ?? ""} onChange={(event) => setPurchaseDraft((current) => ({ ...current, approvedById: event.target.value || null }))}><option value="">Unassigned</option>{bootstrap.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
    <label className="field"><span>PO number</span><input value={purchaseDraft.purchaseOrderNumber ?? ""} onChange={(event) => setPurchaseDraft((current) => ({ ...current, purchaseOrderNumber: event.target.value || null }))} /></label>
    <label className="field"><span>Order status</span><select value={purchaseDraft.orderStatus} onChange={(event) => setPurchaseDraft((current) => ({ ...current, orderStatus: event.target.value as PurchaseItemPayload["orderStatus"] }))}><option value="not-ordered">Not ordered</option><option value="ordered">Ordered</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></label>
    <label className="field"><span>Expected delivery</span><input type="date" value={purchaseDraft.expectedDeliveryDate ?? ""} onChange={(event) => setPurchaseDraft((current) => ({ ...current, expectedDeliveryDate: event.target.value || null }))} /></label>
    <label className="field"><span>Tracking number</span><input value={purchaseDraft.trackingNumber ?? ""} onChange={(event) => setPurchaseDraft((current) => ({ ...current, trackingNumber: event.target.value || null }))} /></label>
    <label className="field"><span>Tracking URL</span><input type="url" value={purchaseDraft.trackingUrl ?? ""} onChange={(event) => setPurchaseDraft((current) => ({ ...current, trackingUrl: event.target.value || null }))} /></label>
    <label className="field"><span>Final cost (USD)</span><input min="0" step="0.01" type="number" value={purchaseFinalCost} onChange={(event) => setPurchaseFinalCost(event.target.value)} /></label>
  </>;
}
