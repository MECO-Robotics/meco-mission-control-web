import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  assertCheckSuiteHead,
  assertRequiredCheckRuns,
  assertTrustedCiIdentity,
  assertTrustedCiWorkflow,
  assertTrustedCiWorkflowSha256,
  trustedCiWorkflowSha256,
  validateBootstrapContract,
  validateProductionIntegrationManifest,
} from "./merge-requirements-gate.mjs";

const validContract = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://contracts.meco.ai/platform/bootstrap-v1.schema.json",
  type: "object",
  additionalProperties: false,
  required: ["tasks"],
  properties: { tasks: { type: "array" } },
};

test("bootstrap validation accepts the canonical root security invariants", () => {
  assert.doesNotThrow(() => validateBootstrapContract(validContract));
});

test("bootstrap validation rejects required keys without schemas", () => {
  assert.throws(
    () => validateBootstrapContract({ ...validContract, required: ["members"] }),
    /required key is invalid/,
  );
});

test("production integration manifest pins exact external revisions", () => {
  const manifest = {
    version: 1,
    platform: { branch: "development", revision: "a".repeat(40) },
    mobile: { branch: "development", revision: "b".repeat(40) },
  };
  assert.doesNotThrow(() => validateProductionIntegrationManifest(manifest));
  assert.throws(
    () => validateProductionIntegrationManifest({
      ...manifest,
      platform: { ...manifest.platform, revision: "development" },
    }),
    /full commit SHA/,
  );
  assert.throws(
    () => validateProductionIntegrationManifest({ ...manifest, untrustedRevision: "c".repeat(40) }),
    /Expected values to be strictly deep-equal/,
  );
});

test("required check validation rejects missing and unsuccessful jobs", () => {
  assert.throws(
    () => assertRequiredCheckRuns([], ["ci-validate"]),
    /Missing required checks/,
  );
  assert.throws(
    () => assertRequiredCheckRuns([
      { name: "ci-validate", status: "completed", conclusion: "failure" },
    ], ["ci-validate"]),
    /not successful/,
  );
  assert.throws(
    () => assertRequiredCheckRuns([
      {
        id: 1,
        name: "ci-validate",
        status: "completed",
        conclusion: "success",
        started_at: "2026-08-10T10:00:00Z",
      },
      {
        id: 2,
        name: "ci-validate",
        status: "completed",
        conclusion: "failure",
        started_at: "2026-08-10T11:00:00Z",
      },
    ], ["ci-validate"]),
    /not successful/,
  );
});

test("trusted CI identity and revision checks reject unrelated or stale runs", () => {
  assert.doesNotThrow(() => assertTrustedCiIdentity("pull_request", ".github/workflows/ci.yml"));
  assert.throws(
    () => assertTrustedCiIdentity("push", ".github/workflows/ci.yml"),
    /only pull-request runs/,
  );
  assert.throws(
    () => assertTrustedCiIdentity("pull_request", ".github/workflows/other.yml"),
    /only pull-request runs/,
  );
  assert.doesNotThrow(() => assertCheckSuiteHead("a".repeat(40), "a".repeat(40)));
  assert.throws(
    () => assertCheckSuiteHead("a".repeat(40), "b".repeat(40)),
    /not PR head/,
  );
});

test("trusted CI digest accepts the finalized workflow and rejects PR edits", async () => {
  const workflow = await readFile(".github/workflows/ci.yml");
  assert.equal(createHash("sha256").update(workflow).digest("hex"), "5686aa7904ff3e24ff56cb1941572511d19dca8e4286c0a14502b7f0ec762fd5");
  assert.doesNotThrow(() => assertTrustedCiWorkflow(workflow));
  assert.throws(
    () => assertTrustedCiWorkflow(Buffer.concat([workflow, Buffer.from("# attacker edit\n")])),
    /workflow digest mismatch/,
  );
});

test("pull-request workflows expose neither repository secrets nor write tokens", async () => {
  const ci = await readFile(".github/workflows/ci.yml", "utf8");
  const skills = await readFile(".github/workflows/check-skills.yml", "utf8");
  const autoMerge = await readFile(".github/workflows/codex-automerge.yml", "utf8");
  assert.doesNotMatch(ci, /secrets\.|MECO_PLATFORM_CONTRACT_READ_TOKEN/);
  assert.doesNotMatch(skills, /secrets\.|SKILLS_REPO_(TOKEN|DEPLOY_KEY)/);
  assert.doesNotMatch(ci, /^\s+[a-z-]+:\s*write\s*$/m);
  assert.doesNotMatch(skills, /^\s+[a-z-]+:\s*write\s*$/m);
  assert.doesNotMatch(autoMerge, /^  pull_request:/m);
  assert.match(autoMerge, /^  pull_request_target:/m);
  assert.match(autoMerge, /getCombinedStatusForRef/);
  assert.match(autoMerge, /status\.context === 'merge-requirements'/);
  assert.match(autoMerge, /actions\/runs\/\$\{trustedRunId\}/);
});

test("all GitHub Actions are pinned and production SSH trust is pre-provisioned", async () => {
  const workflowFiles = [
    ".github/workflows/check-skills.yml",
    ".github/workflows/ci.yml",
    ".github/workflows/codex-automerge.yml",
    ".github/workflows/deploy-vps.yml",
    ".github/workflows/merge-requirements.yml",
  ];
  for (const workflowFile of workflowFiles) {
    const workflow = await readFile(workflowFile, "utf8");
    const actionReferences = [...workflow.matchAll(/^\s*uses:\s*([^\s#]+)/gm)].map((match) => match[1]);
    for (const actionReference of actionReferences) {
      assert.match(actionReference, /@[0-9a-f]{40}$/, `${workflowFile}: ${actionReference}`);
    }
  }
  const deploy = await readFile(".github/workflows/deploy-vps.yml", "utf8");
  assert.doesNotMatch(deploy, /ssh-keyscan/);
  assert.match(deploy, /VPS_SSH_KNOWN_HOSTS/);
  const mergeGate = await readFile(".github/workflows/merge-requirements.yml", "utf8");
  assert.doesNotMatch(mergeGate, /ghcr|packages:|attestations:/i);
  assert.match(mergeGate, /validate-integration/);
  assert.match(mergeGate, /INTEGRATION_OUTCOME/);
  assert.match(mergeGate, /pullRequest\.head\.sha !== headSha/);
  assert.match(mergeGate, /process\.env\.CI_OUTCOME === 'success'/);
});

test("trusted integration validation checks independent repositories", async () => {
  const gate = await readFile("scripts/merge-requirements-gate.mjs", "utf8");
  const verifier = await readFile("scripts/verify-bootstrap-contract.mjs", "utf8");

  assert.match(gate, /meco-mission-control-platform/);
  assert.match(gate, /meco-mission-control-mobile/);
  assert.match(gate, /\["ci-validate", "snapshot-validate"\]/);
  assert.doesNotMatch(gate, /default_branch/);
  assert.match(gate, /production-integration\.json/);
  assert.match(gate, /productionIntegration\.platform/);
  assert.match(gate, /productionIntegration\.mobile/);
  assert.match(gate, /productionIntegration\.platform\.branch !== baseRef/);
  assert.doesNotMatch(gate, /let contractRevision = baseRef/);
  assert.doesNotMatch(gate, /getExternalBranchSha/);
  assert.match(gate, /candidate\.path === "\.github\/workflows\/ci\.yml"/);
  assert.match(gate, /candidate\.event === "pull_request"/);
  assert.match(gate, /candidate\.event === "push"/);
  assert.match(gate, /compare\/\$\{release\.revision\}/);
  assert.match(gate, /raw\.githubusercontent\.com/);
  assert.match(verifier, /process\.env\.GITHUB_TOKEN/);
  assert.match(verifier, /contracts\/production-integration\.json/);
  assert.match(verifier, /manifest\.platform\.revision/);
  assert.match(gate, /await assertExternalRevisionInBranch\(contractRepository/);
  assert.match(verifier, /GITHUB_REF_NAME/);
  assert.match(verifier, /pushedRef\?\.startsWith\("staging"\)/);
  assert.match(verifier, /readPublicRepositoryFile/);
  assert.match(verifier, /deepStrictEqual\(contract, platformContract\)/);
});

test("script CSP contains no inline or eval execution allowances", async () => {
  for (const configFile of ["vite.config.ts", "deploy/pm-web.nginx.conf"]) {
    const config = await readFile(configFile, "utf8");
    const scriptSources = config.match(/script-src ([^;]+)/)?.[1];
    assert.ok(scriptSources, `${configFile} must declare script-src`);
    assert.doesNotMatch(scriptSources, /'unsafe-inline'|'unsafe-eval'/);
    assert.match(config, /script-src-attr 'none'/);
    assert.match(config, /trusted-types meco-mission-control-web-google goog#html/);
  }
});

 test("accepts only the reviewed CI transition digests", () => {
  assert.doesNotThrow(() => assertTrustedCiWorkflowSha256("2660805581abe2cffbb85d3db98a99fa192b20d23624ffa186da04d9c943c894"));
  assert.doesNotThrow(() => assertTrustedCiWorkflowSha256("5686aa7904ff3e24ff56cb1941572511d19dca8e4286c0a14502b7f0ec762fd5"));
  assert.throws(() => assertTrustedCiWorkflowSha256("5686aa7904ff3e24ff56cb1941572511d19dca8e4286c0a14502b7f0ec762fd6"), /digest mismatch/);
});

 test("automerge resolver rejects SHA-scoped statuses shared by multiple PRs", async () => {
  const workflow = await readFile(".github/workflows/codex-automerge.yml", "utf8");
  const prefix = workflow.split("          script: |\n")[1]
    .split("            async function maybeEnableAutoMerge")[0];
  const resolve = new (Object.getPrototypeOf(async function () {}).constructor)(
    "github", "context", "core", `${prefix} return [...pullRequestNumbers];`,
  );
  const context = { serverUrl: "https://github.com", repo: { owner: "org", repo: "web" }, eventName: "workflow_run",
    payload: { workflow_run: { id: 42, conclusion: "success", pull_requests: [] } } };
  const github = {
    rest: { pulls: { list: {} }, repos: { getCombinedStatusForRef: async () => ({ data: {
      statuses: [{ context: "merge-requirements", state: "success", target_url: "https://github.com/org/web/actions/runs/42" }],
    } }) } },
    paginate: async () => [{ number: 1, head: { sha: "same-sha" }, base: { ref: "development" } },
      { number: 2, head: { sha: "same-sha" }, base: { ref: "main" } }],
  };
  await assert.rejects(resolve(github, context, { info() {} }), /Ambiguous pull request/);
  github.paginate = async () => [{ number: 1, head: { sha: "same-sha" } }];
  assert.deepEqual(await resolve(github, context, { info() {} }), [1]);
});
