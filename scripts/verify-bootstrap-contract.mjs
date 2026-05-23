import { readFile } from "node:fs/promises";
import { deepStrictEqual } from "node:assert";
import path from "node:path";

const contractPath = path.resolve(process.cwd(), "contracts/platform/bootstrap/v1/contract.json");

async function readJson(filePath) {
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function readRemoteContract(url, token) {
  const response = await fetch(url, {
    headers: token
      ? {
          authorization: `Bearer ${token}`,
          "user-agent": "meco-contract-verify",
          accept: "application/vnd.github.raw+json",
        }
      : {
          "user-agent": "meco-contract-verify",
          accept: "application/vnd.github.raw+json",
        },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch platform bootstrap contract from ${url}: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

async function resolvePlatformSourceContract() {
  const explicitPath = process.env.PLATFORM_BOOTSTRAP_CONTRACT_SOURCE_PATH;
  if (explicitPath) {
    return {
      source: `local ${explicitPath}`,
      contract: await readJson(path.resolve(process.cwd(), explicitPath)),
    };
  }

  const siblingPath = path.resolve(
    process.cwd(),
    "..",
    "meco-mission-control-platform",
    "contracts/platform/bootstrap/v1/contract.json",
  );
  try {
    const contract = await readJson(siblingPath);
    return {
      source: `local sibling ${siblingPath}`,
      contract,
    };
  } catch {
    // Continue to remote source resolution.
  }

  const remoteBranch = process.env.PLATFORM_BOOTSTRAP_CONTRACT_BRANCH ?? "development";
  const remoteUrl = process.env.PLATFORM_BOOTSTRAP_CONTRACT_URL ??
    `https://raw.githubusercontent.com/MECO-Robotics/meco-mission-control-platform/${remoteBranch}/contracts/platform/bootstrap/v1/contract.json`;

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const contract = await readRemoteContract(remoteUrl, token);
  return {
    source: `remote ${remoteUrl}`,
    contract,
  };
}

async function main() {
  const local = await readJson(contractPath);
  let source;
  try {
    source = await resolvePlatformSourceContract();
  } catch (error) {
    if (process.env.CI === "true") {
      throw error;
    }

    console.warn(
      "Cannot load platform contract source (skipping strict remote contract drift check in non-CI run).",
    );
    return;
  }

  deepStrictEqual(local, source.contract);
  console.log(`Web bootstrap contract matches platform source (${source.source}).`);
}

main().catch((error) => {
  console.error("Web bootstrap contract validation failed.", error.message ?? error);
  process.exit(1);
});
