declare module "occt-import-js" {
  import type { CadAssemblySourceNode, CadMesh } from "./cadGeometry";
  export default function initialize(options: { locateFile: (path: string) => string }): Promise<{
    ReadStepFile(bytes: Uint8Array, options: { linearUnit: string }): {
      success: boolean;
      meshes: CadMesh[];
      root: CadAssemblySourceNode;
    };
  }>;
}
