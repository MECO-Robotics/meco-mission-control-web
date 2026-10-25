import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import type { TopbarAddMenuAction } from "@/features/workspace/shared/ui/WorkspaceTopbarAddMenu";
import { buildTopbarAddMenuActions, makeAddMenuAction } from "@/features/workspace/shared/topbar";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { CadPartImageAssignment, type CadPartImageTargets } from "./CadPartImageAssignment";
import type { CadAssemblyNode, CadMesh } from "./cadGeometry";
import { CadAssemblyTree } from "./CadAssemblyTree";
import { loadBundledAssemblyHierarchy, loadBundledMainAssembly, loadOptimizedRobotPreview } from "./loadBundledCadFile";
import "./cadPartViewer.css";

const CadPartScene = lazy(() => import("./CadPartScene"));
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p role="alert">3D display is unavailable. Enable WebGL and reload to try again.</p> : this.props.children; }
}

function FileViewer({ file, search = "", assemblyMetadata = false, onOrbitingChange, ...imageTargets }: { file: File; search?: string; assemblyMetadata?: boolean; onOrbitingChange?: (isOrbiting: boolean) => void } & CadPartImageTargets) {
  const [geometry, setGeometry] = useState<{ meshes: CadMesh[]; root: CadAssemblyNode } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [isolated, setIsolated] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [reset, setReset] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const optimized = file.name.toLowerCase().endsWith(".glb");
    const loadGeometry = optimized
      ? import("./loadCadGltfGeometry").then(({ loadCadGltfGeometry }) => loadCadGltfGeometry(file, controller.signal))
      : import("./loadCadGeometry").then(({ loadCadGeometry }) => loadCadGeometry(file, controller.signal));
    void loadGeometry.then(async (result) => {
      if (!result.meshes || !result.root) throw new Error("The CAD geometry reader returned no preview meshes.");
      const bundledRoot = optimized && assemblyMetadata
        ? await loadBundledAssemblyHierarchy(result.meshes).catch(() => null)
        : null;
      if (!controller.signal.aborted) setGeometry({ meshes: result.meshes, root: bundledRoot ?? result.root });
    }).catch((cause: Error) => {
      if (!controller.signal.aborted) setError(cause.message);
    });
    return () => controller.abort();
  }, [assemblyMetadata, file]);
  const meshes = geometry?.meshes ?? null;
  const root = geometry?.root;
  const select = (index: number | null) => { setSelected(index); if (index === null) setIsolated(false); };
  const matchingMeshes = meshes?.map((mesh, index) => ({ mesh, index })).filter(({ mesh, index }) =>
    (mesh.name || `Part ${index + 1}`).toLowerCase().includes(search.trim().toLowerCase()),
  );
  return <>
    <p className="cad-viewer-filename">{file.name} · {file.name.toLowerCase().endsWith(".glb") ? "Optimized glTF preview" : "STEP file preview · Dimensions in millimeters"}</p>
    {error ? <p role="alert">{error}</p> : !meshes || !root ? <p role="status">{file.name.toLowerCase().endsWith(".glb") ? "Loading optimized model…" : "Preparing part geometry…"}</p> : <>
      <div className="cad-viewer-toolbar">
        <button type="button" className="secondary-action" onClick={() => setReset((value) => value + 1)}>Fit view</button>
        <button type="button" className="secondary-action" aria-pressed={wireframe} onClick={() => setWireframe(!wireframe)}>Wireframe</button>
        <button type="button" className="secondary-action" disabled={selected === null} aria-pressed={isolated} onClick={() => setIsolated(!isolated)}>Isolate part</button>
        <label className="cad-field"><span>Part</span><select value={selected ?? ""} onChange={(event) => select(event.target.value === "" ? null : Number(event.target.value))}>
          <option value="">All parts ({meshes.length})</option>
          {matchingMeshes?.map(({ mesh: part, index }) => <option key={index} value={index}>{part.name || `Part ${index + 1}`}</option>)}
        </select></label>
      </div>
      <div className="cad-viewport-layout">
        <CadAssemblyTree meshes={meshes} root={root} selected={selected} onSelect={(index) => select(index)} />
        <div className="cad-viewer-canvas" role="img" aria-label={`3D preview of ${file.name}, ${meshes.length} parts`}>
          <SceneBoundary><Suspense fallback={<p role="status">Loading 3D viewer…</p>}>
            <CadPartScene meshes={meshes} selected={selected} isolated={isolated} wireframe={wireframe} reset={reset} onSelect={select} onOrbitingChange={onOrbitingChange} />
          </Suspense></SceneBoundary>
        </div>
      </div>
      <CadPartImageAssignment key={selected ?? "none"} mesh={selected === null ? null : meshes[selected]} {...imageTargets} />
      <p>Drag to rotate · Scroll to zoom · Right-drag to pan. Select a part in the model or the list.</p>
    </>}
  </>;
}

export function EmptyCadViewer({ onOrbitingChange }: { onOrbitingChange?: (isOrbiting: boolean) => void }) {
  return <div className="cad-viewer-canvas" role="img" aria-label="Empty 3D viewer">
    <SceneBoundary><Suspense fallback={null}>
      <CadPartScene meshes={[]} selected={null} isolated={false} wireframe={false} reset={0} onSelect={() => {}} onOrbitingChange={onOrbitingChange} />
    </Suspense></SceneBoundary>
  </div>;
}

export function CadPartViewer({
  file,
  search,
  assemblyMetadata = false,
  onOrbitingChange,
  ...imageTargets
}: { file: File | null; search?: string; assemblyMetadata?: boolean; onOrbitingChange?: (isOrbiting: boolean) => void } & CadPartImageTargets) {
  const [current, setCurrent] = useState({ file, key: 0 });
  if (current.file !== file) setCurrent({ file, key: current.key + 1 });
  return <section className="cad-card cad-part-viewer" aria-label="CAD part viewer">
    {file ? <FileViewer key={current.key} file={file} search={search} assemblyMetadata={assemblyMetadata} onOrbitingChange={onOrbitingChange} {...imageTargets} /> : <EmptyCadViewer onOrbitingChange={onOrbitingChange} />}
  </section>;
}

export function CadFileViewer({
  importPlacement = "inline",
  embeddedInMap = false,
  loadSeedMainAssembly = false,
  projectId,
  seasonId,
  onOpenCadWorkspace,
  additionalTopbarActions = [],
  onOrbitingChange,
  ...imageTargets
}: {
  embeddedInMap?: boolean;
  loadSeedMainAssembly?: boolean;
  projectId?: string | null;
  seasonId?: string | null;
  importPlacement?: "inline" | "topbar";
  onOpenCadWorkspace?: () => void;
  additionalTopbarActions?: TopbarAddMenuAction[];
  onOrbitingChange?: (isOrbiting: boolean) => void;
} & CadPartImageTargets) {
  const navigationParams = typeof window === "undefined" ? null : new URLSearchParams(window.location.search);
  const previewProjectId = projectId ?? navigationParams?.get("project");
  const previewSeasonId = seasonId ?? navigationParams?.get("season");
  const [file, setFile] = useState<File | null>(null);
  const [seedLoadMessage, setSeedLoadMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shouldLoadSeedMainAssembly = embeddedInMap || loadSeedMainAssembly;
  useEffect(() => {
    if (!shouldLoadSeedMainAssembly) {
      setFile(null);
      setSeedLoadMessage(null);
      return;
    }
    let isActive = true;
    setSeedLoadMessage(embeddedInMap ? "Loading optimized robot CAD…" : "Loading the 2026 robot assembly…");
    const loadPreview = embeddedInMap
      ? loadOptimizedRobotPreview({ projectId: previewProjectId, seasonId: previewSeasonId })
      : loadBundledMainAssembly();
    void loadPreview.then((seededFile) => {
      if (!isActive) return;
      setFile((current) => current ?? seededFile);
      setSeedLoadMessage(null);
    }).catch((error: unknown) => {
      if (isActive) setSeedLoadMessage(error instanceof Error ? error.message : String(error));
    });
    return () => { isActive = false; };
  }, [embeddedInMap, previewProjectId, previewSeasonId, shouldLoadSeedMainAssembly]);
  return <div className={`cad-local-viewer${embeddedInMap ? " cad-local-viewer-embedded" : ""}`}>
    {!embeddedInMap ? <TopbarResponsiveSearch ariaLabel="Search CAD parts" onChange={setSearch} placeholder="Search CAD parts…" value={search} /> : null}
    {importPlacement === "topbar" ? (
      <>
        <input
          accept=".step,.stp"
          hidden
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          ref={fileInputRef}
          type="file"
        />
        <WorkspaceTopbarAddMenu
          actions={buildTopbarAddMenuActions(
            makeAddMenuAction("Import STEP file", () => fileInputRef.current?.click()),
            ...additionalTopbarActions,
            ...(onOpenCadWorkspace
              ? [makeAddMenuAction("Open CAD integration", onOpenCadWorkspace)]
              : []),
          )}
          ariaLabel={additionalTopbarActions.length ? "Add or import" : "Import CAD"}
          title={additionalTopbarActions.length ? "Add or import" : "Import CAD"}
          tutorialTarget="import-cad-button"
        />
      </>
    ) : (
      <label className="cad-field"><span>STEP file</span>
        <input type="file" accept=".step,.stp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
      </label>
    )}
    {seedLoadMessage ? <p role={file ? "alert" : "status"}>{seedLoadMessage}</p> : null}
    <CadPartViewer file={file} search={search} assemblyMetadata={embeddedInMap} onOrbitingChange={onOrbitingChange} {...imageTargets} />
  </div>;
}
