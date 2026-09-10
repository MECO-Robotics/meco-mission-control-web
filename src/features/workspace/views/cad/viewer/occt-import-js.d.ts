declare module "occt-import-js" {
  import type { CadMesh } from "./cadGeometry";
  export default function initialize(options: { locateFile: (path: string) => string }): Promise<{
    ReadStepFile(bytes: Uint8Array, options: { linearUnit: string }): { success: boolean; meshes: CadMesh[] };
  }>;
}
