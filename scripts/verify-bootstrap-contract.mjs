import { readFile } from "node:fs/promises";
import { deepStrictEqual } from "node:assert";
import path from "node:path";

const contractPath = path.resolve(process.cwd(), "contracts/platform/bootstrap/v1/contract.json");

async function readJson(filePath) {
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function readRemoteContract(url, token) {
  const isApiUrl = url.startsWith("https://api.github.com/");
  const response = await fetch(url, {
    headers: token
      ? {
          authorization: `Bearer ${token}`,
          "user-agent": "meco-contract-verify",
          accept: isApiUrl ? "application/vnd.github+json" : "application/vnd.github.v3.raw+json",
        }
      : {
          "user-agent": "meco-contract-verify",
          accept: isApiUrl ? "application/vnd.github+json" : "application/vnd.github.v3.raw+json",
        },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch platform bootstrap contract from ${url}: ${response.status} ${response.statusText}`,
    );
  }

  const text = await response.text();

  try {
    const data = JSON.parse(text);

    if (typeof data === "object" && data !== null && data.content && data.encoding === "base64") {
      return JSON.parse(Buffer.from(data.content.replace(/\s+/g, ""), "base64").toString("utf8"));
    }

    if (typeof data === "object" && data !== null && typeof data.message === "string") {
      return data;
    }

    return data;
  } catch {
    return JSON.parse(text);
  }
}

async function resolvePlatformSourceContract() {
  const explicitPath = process.env.PLATFORM_BOOTSTRAP_CONTRACT_SOURCE_PATH;
  if (explicitPath) {
    const sourcePath = path.resolve(process.cwd(), explicitPath);
    if (sourcePath === contractPath) {
      throw new Error(
        "PLATFORM_BOOTSTRAP_CONTRACT_SOURCE_PATH must not point to the local mirrored contract.",
      );
    }

    return {
      source: `local ${explicitPath}`,
      contract: await readJson(sourcePath),
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
  const remoteBranchRef = encodeURIComponent(remoteBranch);
  const remoteUrl =
    process.env.PLATFORM_BOOTSTRAP_CONTRACT_URL ??
    `https://api.github.com/repos/MECO-Robotics/meco-mission-control-platform/contents/contracts/platform/bootstrap/v1/contract.json?ref=${remoteBranchRef}`;

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
