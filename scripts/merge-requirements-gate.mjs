import { createHash } from "node:crypto";

export const trustedCiWorkflowSha256 = "2660805581abe2cffbb85d3db98a99fa192b20d23624ffa186da04d9c943c894";

function requireValue(value, name) {
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

async function fetchJson(url, token) {
  const response = await fetch(url, {
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      accept: "application/vnd.github+json",
      "user-agent": "meco-merge-requirements",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`GitHub API request failed (${response.status}): ${url}: ${body}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export function validateBootstrapContract(contract) {
  if (!contract || typeof contract !== "object" || Array.isArray(contract)) {
    throw new Error("Bootstrap contract must be a JSON object.");
  }
  if (contract.$schema !== "https://json-schema.org/draft/2020-12/schema") {
    throw new Error("Bootstrap contract must use JSON Schema draft 2020-12.");
  }
  if (contract.$id !== "https://contracts.meco.ai/platform/bootstrap-v1.schema.json") {
    throw new Error("Bootstrap contract has an unexpected $id.");
  }
  if (contract.type !== "object" || contract.additionalProperties !== false) {
    throw new Error("Bootstrap contract root must be a closed object schema.");
  }
  if (!Array.isArray(contract.required) || contract.required.length === 0) {
    throw new Error("Bootstrap contract must declare required payload keys.");
  }
  if (!contract.properties || typeof contract.properties !== "object") {
    throw new Error("Bootstrap contract must declare payload properties.");
  }
  if (new Set(contract.required).size !== contract.required.length) {
    throw new Error("Bootstrap contract required keys must be unique.");
  }
  for (const key of contract.required) {
    if (typeof key !== "string" || !(key in contract.properties)) {
      throw new Error(`Bootstrap contract required key is invalid: ${String(key)}.`);
    }
  }
}

export function assertRequiredCheckRuns(checkRuns, requiredNames) {
  const byName = new Map();
  for (const checkRun of checkRuns) {
    const previous = byName.get(checkRun.name);
    const currentTime = Date.parse(checkRun.started_at ?? checkRun.completed_at ?? 0) || 0;
    const previousTime = Date.parse(previous?.started_at ?? previous?.completed_at ?? 0) || 0;
    if (!previous || currentTime > previousTime || (
      currentTime === previousTime && Number(checkRun.id ?? 0) > Number(previous.id ?? 0)
    )) {
      byName.set(checkRun.name, checkRun);
    }
  }
  const missing = requiredNames.filter((name) => !byName.has(name));
  if (missing.length > 0) {
    throw new Error(`Missing required checks: ${missing.join(", ")}.`);
  }
  const unsuccessful = requiredNames
    .map((name) => byName.get(name))
    .filter((checkRun) => checkRun.status !== "completed" || checkRun.conclusion !== "success")
    .map((checkRun) => `${checkRun.name}=${checkRun.status}/${checkRun.conclusion ?? "pending"}`);
  if (unsuccessful.length > 0) {
    throw new Error(`Required checks are not successful: ${unsuccessful.join(", ")}.`);
  }
}

export function assertTrustedCiWorkflow(workflowBytes) {
  const actualSha = createHash("sha256").update(workflowBytes).digest("hex");
  if (actualSha !== trustedCiWorkflowSha256) {
    throw new Error(
      `PR CI workflow digest mismatch: expected ${trustedCiWorkflowSha256}, got ${actualSha}.`,
    );
  }
}

async function validateCi() {
  const repository = requireValue(process.env.GITHUB_REPOSITORY, "GITHUB_REPOSITORY");
  const token = requireValue(process.env.GITHUB_TOKEN, "GITHUB_TOKEN");
  const suiteId = requireValue(process.env.CHECK_SUITE_ID, "CHECK_SUITE_ID");
  const headSha = requireValue(process.env.PR_HEAD_SHA, "PR_HEAD_SHA");
  const workflowEvent = requireValue(process.env.WORKFLOW_RUN_EVENT, "WORKFLOW_RUN_EVENT");
  const workflowPath = requireValue(process.env.WORKFLOW_RUN_PATH, "WORKFLOW_RUN_PATH");
  if (workflowEvent !== "pull_request" || workflowPath !== ".github/workflows/ci.yml") {
    throw new Error("Trusted merge requirements accept only pull-request runs from .github/workflows/ci.yml.");
  }
  const suite = await fetchJson(
    `https://api.github.com/repos/${repository}/check-suites/${suiteId}`,
    token,
  );
  if (suite.head_sha !== headSha) {
    throw new Error(`CI check suite belongs to ${suite.head_sha}, not PR head ${headSha}.`);
  }
  const workflowBytes = await readRepositoryFile(
    repository,
    ".github/workflows/ci.yml",
    headSha,
    token,
  );
  assertTrustedCiWorkflow(workflowBytes);
  const payload = await fetchJson(
    `https://api.github.com/repos/${repository}/check-suites/${suiteId}/check-runs?per_page=100`,
    token,
  );
  assertRequiredCheckRuns(payload.check_runs ?? [], [
    "branch-model",
    "ci-validate",
    "snapshot-validate",
  ]);
  console.log(`Trusted CI checks passed for ${headSha}.`);
}

async function readRepositoryFile(repository, filePath, headSha, token) {
  const payload = await fetchJson(
    `https://api.github.com/repos/${repository}/contents/${filePath}?ref=${encodeURIComponent(headSha)}`,
    token,
  );
  if (payload.type !== "file" || payload.encoding !== "base64" || !payload.content) {
    throw new Error(`PR file ${filePath} was not returned as a base64 file.`);
  }
  return Buffer.from(payload.content.replace(/\s+/g, ""), "base64");
}

const command = process.argv[2];
if (command === "validate-ci") {
  await validateCi();
} else if (process.argv[1] === new URL(import.meta.url).pathname) {
  throw new Error("Expected validate-ci command.");
}
