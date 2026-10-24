import type { CadMesh } from "./cadGeometry";

interface BufferView {
  buffer: number;
  byteOffset: number;
  byteLength: number;
  target?: number;
}

interface Accessor {
  bufferView: number;
  componentType: number;
  count: number;
  type: "SCALAR" | "VEC3";
  min?: number[];
  max?: number[];
}

export function encodeCadMeshesAsGlb(meshes: CadMesh[]): ArrayBuffer {
  if (meshes.length === 0) throw new Error("The CAD file contains no renderable geometry.");

  const binaryParts: Uint8Array[] = [];
  const bufferViews: BufferView[] = [];
  const accessors: Accessor[] = [];
  const materials = new Map<string, number>();
  const materialColors: number[][] = [];
  const gltfMeshes: Array<Record<string, unknown>> = [];
  const nodes: Array<Record<string, unknown>> = [];
  let binaryLength = 0;

  const append = (bytes: Uint8Array, target: number) => {
    const padding = (4 - (binaryLength % 4)) % 4;
    if (padding) {
      binaryParts.push(new Uint8Array(padding));
      binaryLength += padding;
    }
    const bufferView = bufferViews.length;
    bufferViews.push({ buffer: 0, byteOffset: binaryLength, byteLength: bytes.byteLength, target });
    binaryParts.push(bytes);
    binaryLength += bytes.byteLength;
    return bufferView;
  };

  const addFloatAccessor = (values: number[], type: "SCALAR" | "VEC3", target: number, bounds = false) => {
    const bytes = new Uint8Array(values.length * 4);
    const view = new DataView(bytes.buffer);
    values.forEach((value, index) => view.setFloat32(index * 4, value, true));
    const bufferView = append(bytes, target);
    const accessor: Accessor = { bufferView, componentType: 5126, count: values.length / (type === "VEC3" ? 3 : 1), type };
    if (bounds) {
      const min = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
      const max = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
      for (let index = 0; index < values.length; index += 3) {
        for (let axis = 0; axis < 3; axis += 1) {
          min[axis] = Math.min(min[axis], values[index + axis]);
          max[axis] = Math.max(max[axis], values[index + axis]);
        }
      }
      accessor.min = min;
      accessor.max = max;
    }
    accessors.push(accessor);
    return accessors.length - 1;
  };

  const addIndexAccessor = (values: number[]) => {
    const bytes = new Uint8Array(values.length * 4);
    const view = new DataView(bytes.buffer);
    values.forEach((value, index) => view.setUint32(index * 4, value, true));
    const bufferView = append(bytes, 34963);
    accessors.push({ bufferView, componentType: 5125, count: values.length, type: "SCALAR" });
    return accessors.length - 1;
  };

  meshes.forEach((mesh, index) => {
    const position = addFloatAccessor(mesh.attributes.position.array, "VEC3", 34962, true);
    const attributes: Record<string, number> = { POSITION: position };
    if (mesh.attributes.normal?.array.length === mesh.attributes.position.array.length) {
      attributes.NORMAL = addFloatAccessor(mesh.attributes.normal.array, "VEC3", 34962);
    }
    const indices = addIndexAccessor(mesh.index.array);
    const color = mesh.color ?? [0.72, 0.78, 0.85];
    const materialKey = color.join(",");
    let material = materials.get(materialKey);
    if (material === undefined) {
      material = materials.size;
      materials.set(materialKey, material);
      materialColors.push(color);
    }
    gltfMeshes.push({
      name: mesh.name || `Part ${index + 1}`,
      primitives: [{ attributes, indices, material, mode: 4 }],
    });
    nodes.push({ name: mesh.name || `Part ${index + 1}`, mesh: index });
  });

  const binary = new Uint8Array(binaryLength);
  let offset = 0;
  for (const part of binaryParts) {
    binary.set(part, offset);
    offset += part.byteLength;
  }
  const json = {
    asset: { version: "2.0", generator: "MECO Mission Control CAD preview" },
    scene: 0,
    scenes: [{ nodes: nodes.map((_node, index) => index) }],
    nodes,
    meshes: gltfMeshes,
    materials: materialColors.map((color) => ({
      pbrMetallicRoughness: { baseColorFactor: [...color, 1], metallicFactor: 0.12, roughnessFactor: 0.7 },
    })),
    accessors,
    bufferViews,
    buffers: [{ byteLength: binary.byteLength }],
  };
  const jsonBytesRaw = new TextEncoder().encode(JSON.stringify(json));
  const jsonLength = (jsonBytesRaw.byteLength + 3) & ~3;
  const binaryChunkLength = (binary.byteLength + 3) & ~3;
  const totalLength = 12 + 8 + jsonLength + 8 + binaryChunkLength;
  const glb = new ArrayBuffer(totalLength);
  const header = new DataView(glb);
  header.setUint32(0, 0x46546c67, true);
  header.setUint32(4, 2, true);
  header.setUint32(8, totalLength, true);
  header.setUint32(12, jsonLength, true);
  header.setUint32(16, 0x4e4f534a, true);
  new Uint8Array(glb, 20, jsonBytesRaw.byteLength).set(jsonBytesRaw);
  new Uint8Array(glb, 20 + jsonBytesRaw.byteLength, jsonLength - jsonBytesRaw.byteLength).fill(0x20);
  const binaryHeader = 20 + jsonLength;
  header.setUint32(binaryHeader, binaryChunkLength, true);
  header.setUint32(binaryHeader + 4, 0x004e4942, true);
  new Uint8Array(glb, binaryHeader + 8, binary.byteLength).set(binary);
  return glb;
}
