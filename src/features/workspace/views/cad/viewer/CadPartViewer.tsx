import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { CadPartImageAssignment, type CadPartImageTargets } from "./CadPartImageAssignment";
import type { CadMesh } from "./cadGeometry";
import "./cadPartViewer.css";

const CadPartScene = lazy(() => import("./CadPartScene"));
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p role="alert">3D display is unavailable. Enable WebGL and reload to try again.</p> : this.props.children; }
}

function FileViewer({ file, ...imageTargets }: { file: File } & CadPartImageTargets) {
  const [meshes, setMeshes] = useState<CadMesh[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [isolated, setIsolated] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [reset, setReset] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void import("./loadCadGeometry").then(({ loadCadGeometry }) => loadCadGeometry(file, controller.signal)).then((result) => {
      if (!controller.signal.aborted) setMeshes(result);
    }).catch((cause: Error) => {
      if (!controller.signal.aborted) setError(cause.message);
    });
    return () => controller.abort();
  }, [file]);
  const select = (index: number | null) => { setSelected(index); if (index === null) setIsolated(false); };
  return <>
    <p className="cad-viewer-filename">{file.name} · File preview · Dimensions in millimeters</p>
    {error ? <p role="alert">{error}</p> : !meshes ? <p role="status">Preparing part geometry…</p> : <>
      <div className="cad-viewer-toolbar">
        <button type="button" className="secondary-button" onClick={() => setReset((value) => value + 1)}>Fit view</button>
        <button type="button" className="secondary-button" aria-pressed={wireframe} onClick={() => setWireframe(!wireframe)}>Wireframe</button>
        <button type="button" className="secondary-button" disabled={selected === null} aria-pressed={isolated} onClick={() => setIsolated(!isolated)}>Isolate part</button>
        <label className="cad-field"><span>Part</span><select value={selected ?? ""} onChange={(event) => select(event.target.value === "" ? null : Number(event.target.value))}>
          <option value="">All parts ({meshes.length})</option>
          {meshes.map((part, index) => <option key={index} value={index}>{part.name || `Part ${index + 1}`}</option>)}
        </select></label>
      </div>
      <div className="cad-viewer-canvas" role="img" aria-label={`3D preview of ${file.name}, ${meshes.length} parts`}>
        <SceneBoundary><Suspense fallback={<p role="status">Loading 3D viewer…</p>}>
          <CadPartScene meshes={meshes} selected={selected} isolated={isolated} wireframe={wireframe} reset={reset} onSelect={select} />
        </Suspense></SceneBoundary>
      </div>
      <CadPartImageAssignment key={selected ?? "none"} mesh={selected === null ? null : meshes[selected]} {...imageTargets} />
      <p>Drag to rotate · Scroll to zoom · Right-drag to pan. Select a part in the model or the list.</p>
    </>}
  </>;
}

export function EmptyCadViewer() {
  return <div className="cad-viewer-canvas" role="img" aria-label="Empty 3D viewer">
    <SceneBoundary><Suspense fallback={null}>
      <CadPartScene meshes={[]} selected={null} isolated={false} wireframe={false} reset={0} onSelect={() => {}} />
    </Suspense></SceneBoundary>
  </div>;
}

export function CadPartViewer({ file, ...imageTargets }: { file: File | null } & CadPartImageTargets) {
  // A file identity change replaces the entire reader and selection state.
  const [current, setCurrent] = useState({ file, key: 0 });
  if (current.file !== file) setCurrent({ file, key: current.key + 1 });
  return <section className="cad-card cad-part-viewer" aria-label="CAD part viewer">
    <h3>Part viewer</h3>
    {file ? <FileViewer key={current.key} file={file} {...imageTargets} /> : <EmptyCadViewer />}
  </section>;
}

export function CadFileViewer({
  title = "CAD parts",
  description = "Inspect a STEP file locally. Sign in to import its structure into a workspace or connect Onshape.",
  ...imageTargets
}: { title?: string; description?: string } & CadPartImageTargets) {
  const [file, setFile] = useState<File | null>(null);
  return <div className="cad-local-viewer">
    <h2>{title}</h2>
    <p>{description}</p>
    <label className="cad-field"><span>STEP file</span>
      <input type="file" accept=".step,.stp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
    </label>
    <CadPartViewer file={file} {...imageTargets} />
  </div>;
}
