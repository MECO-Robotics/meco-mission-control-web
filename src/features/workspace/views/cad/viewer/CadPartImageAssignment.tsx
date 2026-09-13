import { useEffect, useRef, useState } from "react";
import type { PartDefinitionRecord } from "@/types/recordsInventory";
import type { CadMesh } from "./cadGeometry";

export interface CadPartImageTargets {
  partDefinitions?: PartDefinitionRecord[];
  onSavePartImage?: (partId: string, revision: string, imageUrl: string) => Promise<void>;
}

export function CadPartImageAssignment({ mesh, partDefinitions = [], onSavePartImage }: CadPartImageTargets & { mesh: CadMesh | null }) {
  const [partId, setPartId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const target = partDefinitions.find((part) => part.id === partId && !part.isArchived);
  if (!onSavePartImage) return null;
  const save = async () => {
    if (!mesh || !target || busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const { renderCadThumbnail } = await import("./renderCadThumbnail");
      if (!active.current) return;
      const imageUrl = renderCadThumbnail(mesh);
      await onSavePartImage(target.id, target.revision, imageUrl);
      if (active.current) setMessage(`Part image saved for ${target.partNumber} · ${target.name} · revision ${target.revision}.`);
    } catch (cause) {
      if (active.current) setError(cause instanceof Error ? cause.message : "The part image could not be saved.");
    } finally { if (active.current) setBusy(false); }
  };
  return <div className="cad-part-image-assignment">
    <label className="cad-field"><span>Save image to part</span>
      <select value={partId} disabled={busy} onChange={(event) => { setPartId(event.target.value); setMessage(""); setError(""); }}>
        <option value="">Choose a part and revision</option>
        {partDefinitions.filter((part) => !part.isArchived).map((part) => <option key={part.id} value={part.id}>
          {part.partNumber} · {part.name} · revision {part.revision}
        </option>)}
      </select>
    </label>
    <p>{mesh ? `Selected CAD part: ${mesh.name || "Unnamed part"}.` : "Select a CAD part in the viewer first."} Choose its matching part record to save an angled still.</p>
    <button type="button" className="secondary-action" disabled={!mesh || !target || busy} onClick={() => void save()}>
      {busy ? "Saving part image…" : target?.photoUrl ? "Replace part image" : "Save part image"}
    </button>
    {message && <p role="status">{message}</p>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
