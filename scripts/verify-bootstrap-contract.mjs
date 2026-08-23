import { readFile } from "node:fs/promises";
import path from "node:path";
import { deepStrictEqual } from "node:assert";
import {
  readPublicRepositoryFile,
  validateBootstrapContract,
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

  const platformBranch = process.env.MECO_PLATFORM_CONTRACT_BRANCH ??
    process.env.GITHUB_BASE_REF ??
    "development";
  const platformContent = await readPublicRepositoryFile(
    "MECO-Robotics/meco-mission-control-platform",
    "contracts/platform/bootstrap/v1/contract.json",
    platformBranch,
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
