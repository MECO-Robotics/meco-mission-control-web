import { readFile } from "node:fs/promises";
import path from "node:path";
import { validateBootstrapContract } from "./merge-requirements-gate.mjs";

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

  console.log("Web bootstrap contract is valid canonical JSON.");
  console.log("Cross-repository drift is enforced by the trusted merge-requirements workflow.");
}

main().catch((error) => {
  console.error("Web bootstrap contract validation failed.", error.message ?? error);
  process.exit(1);
});
