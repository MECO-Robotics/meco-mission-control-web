export interface CadMesh {
  name: string;
  color?: [number, number, number];
  attributes: { position: { array: number[] }; normal?: { array: number[] } };
  index: { array: number[] };
}

export type CadGeometryResult = { meshes: CadMesh[]; error?: never } | { error: string; meshes?: never };

export function validateCadMeshes(meshes: CadMesh[]): CadMesh[] {
  const renderable = meshes.filter((mesh) => mesh.index.array.length > 0);
  if (!renderable.length) throw new Error("This STEP file contains no displayable solid or surface geometry.");
  for (const mesh of renderable) {
    const positions = mesh.attributes.position.array;
    if (positions.length % 3 !== 0 || !positions.every(Number.isFinite)
      || mesh.index.array.length % 3 !== 0
      || !mesh.index.array.every((i) => Number.isInteger(i) && i >= 0 && i < positions.length / 3)) {
      throw new Error("The STEP file produced invalid geometry. Re-export it from your CAD application.");
    }
  }
  return renderable;
}
