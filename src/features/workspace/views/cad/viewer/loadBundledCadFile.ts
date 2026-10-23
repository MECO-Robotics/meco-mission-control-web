let mainAssemblyPromise: Promise<File> | null = null;

export function loadBundledMainAssembly(): Promise<File> {
  if (!mainAssemblyPromise) {
    mainAssemblyPromise = fetch("/cad/main-assembly.step.gzdata")
      .then(async (response) => {
        if (!response.ok || !response.body) throw new Error("The seeded robot CAD asset could not be loaded.");
        if (typeof DecompressionStream === "undefined") throw new Error("This browser cannot decompress the seeded robot CAD asset.");
        const decompressed = response.body.pipeThrough(new DecompressionStream("gzip"));
        const blob = await new Response(decompressed).blob();
        return new File([blob], "MAIN ASSEMBLY.step", { type: "application/step" });
      })
      .catch((error) => {
        mainAssemblyPromise = null;
        throw error;
      });
  }
  return mainAssemblyPromise;
}
