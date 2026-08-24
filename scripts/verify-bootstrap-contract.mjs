import { readFile } from "node:fs/promises";
import path from "node:path";
import { deepStrictEqual } from "node:assert";
import {
  readPublicRepositoryFile,
  validateBootstrapContract,
  validateProductionIntegrationManifest,
} from "./merge-requirements-gate.mjs";

const contractPath = path.resolve(
  process.cwd(),
  "contracts/platform/bootstrap/v1/contract.json",
);

async function main() {
  const content = await readFile(contractPath, "utf8");
  const contract = JSON.parse(content);
  validateBootstrapContract(contract);

  const canonical = `${JSON.stringify(contract, null, 2)}\n`;
  if (content !== canonical) {
    throw new Error("Bootstrap contract must use canonical two-space JSON formatting.");
  }

  const pushedRef = process.env.GITHUB_REF_NAME;
  const pushedChannel = pushedRef === "main" ||
    pushedRef === "development" ||
    pushedRef?.startsWith("staging")
    ? pushedRef
    : undefined;
  let platformBranch = [
    process.env.MECO_PLATFORM_CONTRACT_BRANCH,
    pushedChannel,
  ].find((value) => value?.trim()) ?? "development";
  if (process.env.GITHUB_BASE_REF) {
    const manifest = JSON.parse(await readFile(
      path.resolve(process.cwd(), "contracts/production-integration.json"),
      "utf8",
    ));
    validateProductionIntegrationManifest(manifest);
    if (process.env.GITHUB_BASE_REF !== "main" && manifest.platform.branch !== process.env.GITHUB_BASE_REF) {
      throw new Error(
        `Pinned platform branch ${manifest.platform.branch} does not match PR base ${process.env.GITHUB_BASE_REF}.`,
      );
    }
    platformBranch = manifest.platform.revision;
  }
  const platformContent = await readPublicRepositoryFile(
    "MECO-Robotics/meco-mission-control-platform",
    "contracts/platform/bootstrap/v1/contract.json",
    platformBranch,
    process.env.GITHUB_TOKEN,
  );
  const platformContract = JSON.parse(platformContent.toString("utf8"));
  validateBootstrapContract(platformContract);
  deepStrictEqual(contract, platformContract);

  console.log(`Web bootstrap contract matches platform ${platformBranch}.`);
}

main().catch((error) => {
  console.error("Web bootstrap contract validation failed.", error.message ?? error);
  process.exit(1);
});
