import { ModalDialog } from "@/components/ModalDialog";
import type { Dispatch, SetStateAction } from "react";
import type { RiskPayload } from "@/types/payloads";
import type { SelectOption } from "./riskViewData/riskViewDataPayload";
import { FilterDropdown } from "../shared/filters/FilterDropdown";

const riskCategoryOptions = [
  ["dependency", "Dependency"], ["design", "Design"], ["manufacturing", "Manufacturing"],
  ["supply", "Supply"], ["schedule", "Schedule"], ["qa", "Quality assurance"],
  ["inventory", "Inventory"], ["help", "Help request"], ["other", "Other"],
] as const;
const riskSeverityOptions = [["critical", "Critical"], ["high", "High"], ["medium", "Medium"], ["low", "Low"]] as const;
const riskStatusOptions = [["open", "Open"], ["in-progress", "In progress"], ["blocked", "Blocked"], ["resolved", "Resolved"]] as const;

interface RiskEditorModalProps {
  draft: RiskPayload;
  editorError: string | null;
  editorMode: "edit" | "create" | null;
  isDeleting: boolean;
  isSaving: boolean;
  mitigationTaskOptions: SelectOption[];
  targetOptions: SelectOption[];
  responsibleGroupOptions: SelectOption[];
  ownerOptions: SelectOption[];
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
  setDraft: Dispatch<SetStateAction<RiskPayload>>;
}

export function RiskEditorModal({ draft, editorError, editorMode, isDeleting, isSaving, mitigationTaskOptions, targetOptions, responsibleGroupOptions, ownerOptions, onClose, onDelete, onSave, setDraft }: RiskEditorModalProps) {
  if (!editorMode) return null;
  const selectedTargets = draft.relatedTargets.map((target) => `${target.kind}:${target.id}`);
  return <ModalDialog label="Risk editor" onClose={onClose} dismissOnBackdrop>
    <section className="modal-card">
      <div className="panel-header compact-header"><h2>{editorMode === "create" ? "Create risk" : "Edit risk"}</h2><button className="icon-button" onClick={onClose} type="button">Close</button></div>
      <form className="modal-form" onSubmit={(event) => { event.preventDefault(); void onSave(); }}>
        <label className="field modal-wide"><span>Title</span><input required value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} /></label>
        <label className="field modal-wide"><span>Details</span><textarea required rows={4} value={draft.detail} onChange={(event) => setDraft((current) => ({ ...current, detail: event.target.value }))} /></label>
        <label className="field"><span>Project</span><select value={draft.projectId} onChange={(event) => setDraft((current) => ({ ...current, projectId: event.target.value }))}><option value="">Select project</option>{targetOptions.filter((option) => option.id.startsWith("project:")).map((option) => <option key={option.id} value={option.id.slice("project:".length)}>{option.name.replace("Project · ", "")}</option>)}</select></label>
        <label className="field"><span>Category</span><select value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value as RiskPayload["category"] }))}>{riskCategoryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="field"><span>Severity</span><select value={draft.severity} onChange={(event) => setDraft((current) => ({ ...current, severity: event.target.value as RiskPayload["severity"] }))}>{riskSeverityOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="field"><span>Status</span><select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as RiskPayload["status"] }))}>{riskStatusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="field"><span>Owner</span><select value={draft.ownerMemberId ?? ""} onChange={(event) => setDraft((current) => ({ ...current, ownerMemberId: event.target.value || null }))}><option value="">Unassigned</option>{ownerOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
        <label className="field"><span>Mitigation due date</span><input type="date" value={draft.mitigationDueDate ?? ""} onChange={(event) => setDraft((current) => ({ ...current, mitigationDueDate: event.target.value || null }))} /></label>
        <div className="field modal-wide"><span>Related domain records</span><FilterDropdown allLabel="Related records" ariaLabel="Related domain records" searchInTopbar compactSummary options={targetOptions.filter((option) => !option.id.startsWith("risk:"))} onChange={(selection) => setDraft((current) => ({ ...current, relatedTargets: selection.map((value) => { const separator = value.indexOf(":"); return { kind: value.slice(0, separator), id: value.slice(separator + 1) } as RiskPayload["relatedTargets"][number]; }) }))} showAllOption={false} value={selectedTargets} /><div className="modal-inline-selections">{draft.relatedTargets.map((target) => <span className="status-pill" key={`${target.kind}:${target.id}`}>{targetOptions.find((option) => option.id === `${target.kind}:${target.id}`)?.name ?? `${target.kind} · ${target.id}`}</span>)}</div></div>
        <label className="field"><span>Mitigation Task</span><select value={draft.mitigationTaskId ?? ""} onChange={(event) => setDraft((current) => ({ ...current, mitigationTaskId: event.target.value || null }))}><option value="">None</option>{mitigationTaskOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
        <label className="field"><span>Responsible group</span><select value={draft.ownerGroupId ?? ""} onChange={(event) => setDraft((current) => ({ ...current, ownerGroupId: event.target.value || null }))}><option value="">Unassigned</option>{responsibleGroupOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
        <label className="field checkbox-field modal-wide"><input type="checkbox" checked={draft.blocksWork} onChange={(event) => setDraft((current) => ({ ...current, blocksWork: event.target.checked }))} /><span>Blocks work</span></label>
        {editorError ? <p className="section-copy modal-wide" style={{ color: "var(--official-red)" }}>{editorError}</p> : null}
        <div className="modal-actions modal-wide">{editorMode === "edit" ? <button className="secondary-action danger-action" disabled={isDeleting || isSaving} onClick={() => void onDelete()} type="button">{isDeleting ? "Deleting..." : "Delete"}</button> : <span />}<div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}><button className="secondary-action" disabled={isSaving || isDeleting} onClick={onClose} type="button">Cancel</button><button className="primary-action" disabled={isSaving || isDeleting} type="submit">{isSaving ? "Saving..." : editorMode === "create" ? "Create risk" : "Save changes"}</button></div></div>
      </form>
    </section>
  </ModalDialog>;
}
