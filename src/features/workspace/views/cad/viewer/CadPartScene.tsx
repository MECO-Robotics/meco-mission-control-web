import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls } from "@react-three/drei";
import { Box3, Color, Vector3 } from "three";
import type { CadMesh } from "./cadGeometry";

function Part({ part, selected, wireframe, onSelect }: {
  part: CadMesh; selected: boolean; wireframe: boolean; onSelect: () => void;
}) {
  const positions = useMemo(() => new Float32Array(part.attributes.position.array), [part]);
  const normals = useMemo(() => part.attributes.normal ? new Float32Array(part.attributes.normal.array) : null, [part]);
  const indices = useMemo(() => new Uint32Array(part.index.array), [part]);
  const color = part.color ? new Color().setRGB(...part.color, "srgb") : "#b8c7d9";
  return (
    <mesh onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <bufferGeometry onUpdate={(geometry) => { if (!normals) geometry.computeVertexNormals(); }}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        {normals && <bufferAttribute attach="attributes-normal" args={[normals, 3]} />}
        <bufferAttribute attach="index" args={[indices, 1]} />
      </bufferGeometry>
      <meshStandardMaterial color={color} emissive={selected ? "#386fba" : "#000000"} emissiveIntensity={0.45} metalness={0.15} roughness={0.65} wireframe={wireframe} />
    </mesh>
  );
}

export default function CadPartScene({ meshes, selected, isolated, wireframe, reset, onSelect }: {
  meshes: CadMesh[]; selected: number | null; isolated: boolean; wireframe: boolean; reset: number;
  onSelect: (index: number | null) => void;
}) {
  const camera = useMemo(() => {
    const box = new Box3();
    const vertex = new Vector3();
    for (const part of meshes) {
      const values = part.attributes.position.array;
      for (let i = 0; i < values.length; i += 3) box.expandByPoint(vertex.fromArray(values, i));
    }
    const center = box.getCenter(new Vector3());
    const distance = Math.max(box.getSize(new Vector3()).length(), 1) * 2;
    return { position: center.add(new Vector3(1, -1, 0.8).multiplyScalar(distance)), up: new Vector3(0, 0, 1) };
  }, [meshes]);
  return (
    <Canvas frameloop="demand" dpr={[1, 2]} camera={camera}
      onPointerMissed={() => onSelect(null)} fallback={<p>3D display needs a browser with WebGL enabled.</p>}>
      <color attach="background" args={["#17202c"]} />
      <ambientLight intensity={1.4} />
      <directionalLight position={[1, -2, 3]} intensity={2.5} />
      <directionalLight position={[-2, 1, -1]} intensity={1} />
      <Bounds key={`${reset}-${isolated}-${isolated ? selected : "all"}`} fit clip observe margin={1.6} maxDuration={0}>
        <group>
          {meshes.map((part, index) => (!isolated || selected === index) && (
            <Part key={index} part={part} selected={selected === index} wireframe={wireframe} onSelect={() => onSelect(index)} />
          ))}
        </group>
      </Bounds>
      <OrbitControls makeDefault enableDamping={false} />
    </Canvas>
  );
}
