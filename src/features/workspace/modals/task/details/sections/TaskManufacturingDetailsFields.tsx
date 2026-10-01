import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads/task";
import type { ManufacturingDetailsRecord, ManufacturingProcessRecord, TaskRecord } from "@/types/recordsExecution";
import { archiveManufacturingProcessRecord, createManufacturingProcessRecord } from "@/lib/auth/records/production";

function newManufacturingDetails(bootstrap: BootstrapPayload): ManufacturingDetailsRecord {
  const part = bootstrap.partDefinitions[0];
  const material = bootstrap.materials[0];
  return {
    part: part ? { kind: "part-definition", partDefinitionId: part.id } : { kind: "provisional", partNumber: "", revision: "" },
    quantity: 1,
    processId: bootstrap.manufacturingProcesses.find((item) => item.isActive)?.id ?? "",
    fulfillmentSource: "in-house",
    material: material ? { kind: "inventory-material", materialId: material.id } : { kind: "specified-material", name: "" },
    fileArtifactIds: [],
    tolerances: [],
    qaRequirements: [],
  };
}

interface TaskManufacturingDetailsFieldsProps {
  activeTask: TaskRecord;
  bootstrap: BootstrapPayload;
  canEdit: boolean;
  setTaskDraft?: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft?: TaskPayload;
}

export function TaskManufacturingDetailsFields({ activeTask, bootstrap, canEdit, setTaskDraft, taskDraft }: TaskManufacturingDetailsFieldsProps) {
  const [processes, setProcesses] = useState(bootstrap.manufacturingProcesses);
  const [newProcessName, setNewProcessName] = useState("");
  const [processMessage, setProcessMessage] = useState<string | null>(null);
  const [isSavingProcess, setIsSavingProcess] = useState(false);
  useEffect(() => setProcesses(bootstrap.manufacturingProcesses), [bootstrap.manufacturingProcesses]);
  const task = taskDraft ?? activeTask;
  const project = bootstrap.projects.find((item) => item.id === task.projectId);
  const workType = bootstrap.workTypes.find((item) => item.id === task.workTypeId);
  const isManufacturing = project?.projectType === "robot" && workType?.code === "manufacturing";
  if (!isManufacturing) return null;

  const details = task.manufacturingDetails;
  const update = (patch: Partial<ManufacturingDetailsRecord>) => setTaskDraft?.((current) => ({
    ...current,
    manufacturingDetails: { ...(current.manufacturingDetails ?? newManufacturingDetails(bootstrap)), ...patch },
  }));
  const updateProvisionalPart = (patch: { partNumber?: string; revision?: string }) => {
    if (details?.part.kind === "provisional") update({ part: { ...details.part, ...patch } });
  };
  const updateLines = (field: "tolerances" | "qaRequirements", value: string) => update({ [field]: value.split("\n").map((line) => line.trim()).filter(Boolean) });
  const saveProcess = async () => {
    const name = newProcessName.trim();
    const code = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!name || !code) { setProcessMessage("Enter a process name using letters or numbers."); return; }
    setIsSavingProcess(true);
    setProcessMessage(null);
    try {
      const created = await createManufacturingProcessRecord({ code, name });
      setProcesses((current) => [...current, created]);
      setNewProcessName("");
      setProcessMessage("Process added to the Robot manufacturing catalog.");
    } catch (error) {
      setProcessMessage(error instanceof Error ? error.message : "Could not add the manufacturing process.");
    } finally { setIsSavingProcess(false); }
  };
  const archiveProcess = async (process: ManufacturingProcessRecord) => {
    setIsSavingProcess(true);
    setProcessMessage(null);
    try {
      const archived = await archiveManufacturingProcessRecord(process.id);
      setProcesses((current) => current.map((item) => item.id === archived.id ? archived : item));
      setProcessMessage(`${archived.name} was archived; existing work retains its process history.`);
    } catch (error) {
      setProcessMessage(error instanceof Error ? error.message : "Could not archive the manufacturing process.");
    } finally { setIsSavingProcess(false); }
  };

  return (
    <section className="modal-wide task-manufacturing-details">
      <h3>Manufacturing technical requirements</h3>
      {!details && canEdit ? (
        <button className="secondary-action" onClick={() => update(newManufacturingDetails(bootstrap))} type="button">Add manufacturing details</button>
      ) : details ? (
        <div className="task-details-section-grid">
          <label className="field"><span>Part source</span><select disabled={!canEdit} value={details.part.kind} onChange={(event) => update({ part: event.target.value === "part-definition" ? (bootstrap.partDefinitions[0] ? { kind: "part-definition", partDefinitionId: bootstrap.partDefinitions[0].id } : { kind: "provisional", partNumber: "", revision: "" }) : { kind: "provisional", partNumber: "", revision: "" } })}><option value="part-definition">Part definition</option><option value="provisional">Provisional part</option></select></label>
          {details.part.kind === "part-definition" ? <label className="field"><span>Part definition</span><select disabled={!canEdit} required value={details.part.partDefinitionId} onChange={(event) => update({ part: { kind: "part-definition", partDefinitionId: event.target.value } })}>{bootstrap.partDefinitions.map((item) => <option key={item.id} value={item.id}>{item.partNumber} · Rev {item.revision} · {item.name}</option>)}</select></label> : <><label className="field"><span>Part number</span><input disabled={!canEdit} required value={details.part.partNumber} onChange={(event) => updateProvisionalPart({ partNumber: event.target.value })} /></label><label className="field"><span>Revision</span><input disabled={!canEdit} required value={details.part.revision} onChange={(event) => updateProvisionalPart({ revision: event.target.value })} /></label></>}
          <label className="field"><span>Quantity</span><input disabled={!canEdit} min="1" required type="number" value={details.quantity} onChange={(event) => update({ quantity: Math.max(1, Number(event.target.value)) })} /></label>
          <label className="field"><span>Process</span><select disabled={!canEdit} required value={details.processId} onChange={(event) => update({ processId: event.target.value })}><option value="">Choose process</option>{processes.map((item) => <option disabled={!item.isActive} key={item.id} value={item.id}>{item.name}{item.isActive ? "" : " (archived)"}</option>)}</select></label>
          <label className="field"><span>Fulfillment source</span><select disabled={!canEdit} value={details.fulfillmentSource} onChange={(event) => update({ fulfillmentSource: event.target.value as ManufacturingDetailsRecord["fulfillmentSource"] })}><option value="in-house">In-house</option><option value="outsourced">Outsourced</option></select></label>
          <label className="field"><span>Material source</span><select disabled={!canEdit} value={details.material.kind} onChange={(event) => update({ material: event.target.value === "inventory-material" ? (bootstrap.materials[0] ? { kind: "inventory-material", materialId: bootstrap.materials[0].id } : { kind: "specified-material", name: "" }) : { kind: "specified-material", name: "" } })}><option value="inventory-material">Inventory material</option><option value="specified-material">Specify material</option></select></label>
          {details.material.kind === "inventory-material" ? <label className="field"><span>Material</span><select disabled={!canEdit} required value={details.material.materialId} onChange={(event) => update({ material: { kind: "inventory-material", materialId: event.target.value } })}>{bootstrap.materials.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label> : <label className="field"><span>Material</span><input disabled={!canEdit} required value={details.material.name} onChange={(event) => update({ material: { kind: "specified-material", name: event.target.value } })} /></label>}
          <label className="field"><span>Fabrication files</span><select aria-label="Fabrication files" disabled={!canEdit} multiple value={details.fileArtifactIds} onChange={(event) => update({ fileArtifactIds: Array.from(event.target.selectedOptions, (option) => option.value) })}>{bootstrap.artifacts.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
          <label className="field"><span>Tolerances (one per line)</span><textarea disabled={!canEdit} value={details.tolerances.join("\n")} onChange={(event) => updateLines("tolerances", event.target.value)} /></label>
          <label className="field"><span>QA requirements (one per line)</span><textarea disabled={!canEdit} value={details.qaRequirements.join("\n")} onChange={(event) => updateLines("qaRequirements", event.target.value)} /></label>
          <label className="field"><span>Batch label</span><input disabled={!canEdit} value={details.batchLabel ?? ""} onChange={(event) => update({ batchLabel: event.target.value || undefined })} /></label>
        </div>
      ) : <p className="muted-copy">Manufacturing details have not been added.</p>}
      {canEdit ? <details className="task-details-section-collapse modal-wide">
        <summary className="task-details-section-title task-details-section-summary">Manage Robot manufacturing processes</summary>
        <div className="task-details-section-grid">
          <label className="field"><span>New process name</span><input maxLength={80} value={newProcessName} onChange={(event) => setNewProcessName(event.target.value)} /></label>
          <button className="secondary-action" disabled={isSavingProcess} onClick={() => void saveProcess()} type="button">{isSavingProcess ? "Saving…" : "Add process"}</button>
          {processes.filter((item) => item.isActive).map((process) => <div className="field" key={process.id}><span>{process.name}</span><button className="ghost-button" disabled={isSavingProcess} onClick={() => void archiveProcess(process)} type="button">Archive</button></div>)}
        </div>
        {processMessage ? <p aria-live="polite" className="section-copy">{processMessage}</p> : null}
        <p className="section-copy">Only mentors can add or archive process types. Archived processes remain attached to existing manufacturing work.</p>
      </details> : null}
      <p className="section-copy">This Task owns technical fabrication requirements. Outsourced vendor, quote, approval, order, cost, delivery, and tracking state belongs to Purchasing.</p>
    </section>
  );
}
