import { useState } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { ManufacturingItemRecord } from "@/types/recordsInventory";
import type { WorkItemRecord } from "@/types/recordsExecution";

interface WorkQueueViewProps {
  bootstrap: BootstrapPayload;
  onEditTask: (task: BootstrapPayload["tasks"][number]) => void;
  onEditManufacturing: (item: BootstrapPayload["manufacturingItems"][number]) => void;
  onCreateTask: () => void;
  onCreateManufacturing: (process: "cnc" | "3d-print" | "fabrication") => void;
  onManufacturingStatusChange?: (item: ManufacturingItemRecord, status: ManufacturingItemRecord["status"]) => Promise<void>;
  showMentorQuickActions?: boolean;
}

export function WorkQueueView({ bootstrap, onEditTask, onEditManufacturing, onCreateTask, onCreateManufacturing, onManufacturingStatusChange, showMentorQuickActions = false }: WorkQueueViewProps) {
  const [processFilter, setProcessFilter] = useState("all");
  const [workTypeFilter, setWorkTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [materialFilter, setMaterialFilter] = useState("all");
  const rows: WorkItemRecord[] = bootstrap.workItems ?? [];
  const materials = Array.from(new Set(rows.map((row) => row.material).filter((value): value is string => Boolean(value)))).sort();
  const filteredRows = rows.filter((row) => (workTypeFilter === "all" || row.workType === workTypeFilter) && (processFilter === "all" || row.manufacturingProcess === processFilter) && (statusFilter === "all" || row.status === statusFilter) && (materialFilter === "all" || row.material === materialFilter));
  return <section className="workspace-panel work-queue" aria-label="Work items">
    <header className="workspace-panel-header"><h2>Work</h2><div><button className="ghost-button" onClick={onCreateTask} type="button">Add task</button> <button className="ghost-button" onClick={() => onCreateManufacturing("cnc")} type="button">Add CNC job</button> <button className="ghost-button" onClick={() => onCreateManufacturing("3d-print")} type="button">Add 3D print</button> <button className="ghost-button" onClick={() => onCreateManufacturing("fabrication")} type="button">Add fabrication</button></div></header>
    <div className="workspace-presentation-controls" aria-label="Work filters">
      <label>Work type <select aria-label="Filter work type" value={workTypeFilter} onChange={(event) => setWorkTypeFilter(event.target.value)}><option value="all">All work types</option>{["Design", "Manufacturing", "Assembly", "Electrical/Wiring", "Programming", "Testing", "Driving"].map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Process <select aria-label="Filter manufacturing process" value={processFilter} onChange={(event) => setProcessFilter(event.target.value)}><option value="all">All processes</option><option value="cnc">CNC</option><option value="3d-print">3D Print</option><option value="fabrication">Fabrication</option></select></label>
      <label>Status <select aria-label="Filter work status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option>{Array.from(new Set(rows.map((row) => row.status))).map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Material <select aria-label="Filter material" value={materialFilter} onChange={(event) => setMaterialFilter(event.target.value)}><option value="all">All materials</option>{materials.map((value) => <option key={value}>{value}</option>)}</select></label>
    </div>
    <div className="work-item-list">{filteredRows.map((row) => {
      const task = row.sourceType === "task" ? bootstrap.tasks.find((entry) => entry.id === row.sourceId) : undefined;
      const manufacturing = row.sourceType === "manufacturing" ? bootstrap.manufacturingItems.find((entry) => entry.id === row.sourceId) : undefined;
      return <div className="work-item-row" key={row.id}>
        <button className="work-item-open" onClick={() => task ? onEditTask(task) : manufacturing && onEditManufacturing(manufacturing)} type="button">
          <span className="work-item-title">{row.title}</span><span>{row.workType}</span>{row.responsibleGroup && <span>{row.responsibleGroup}</span>}
          {row.manufacturingProcess && <span>{row.manufacturingProcess}</span>}<span>{row.status}</span>{row.dueDate && <time>{row.dueDate}</time>}
          {row.quantity !== null && <span>{row.quantity} {row.material ?? ""}</span>}{row.batchLabel && <span>{row.batchLabel}</span>}{row.mentorReviewed !== null && <span>Mentor {row.mentorReviewed ? "reviewed" : "review pending"}</span>}
        </button>
        {manufacturing && showMentorQuickActions && onManufacturingStatusChange && manufacturing.process === "cnc" ? <span className="work-item-actions"><button disabled={manufacturing.status !== "requested"} type="button" onClick={() => void onManufacturingStatusChange(manufacturing, "approved")}>Approve</button><button disabled={manufacturing.status === "complete"} type="button" onClick={() => void onManufacturingStatusChange(manufacturing, "complete")}>Complete</button></span> : null}
      </div>;
    })}</div>
  </section>;
}
