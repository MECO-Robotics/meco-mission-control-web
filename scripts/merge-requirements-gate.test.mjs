import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  assertManifestIsCurrent,
  assertRequiredCheckRuns,
  assertTrustedCiWorkflow,
  trustedCiWorkflowSha256,
  validateBootstrapContract,
  validateManifest,
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

test("manifest validation binds channel, revision, and exact contract bytes", () => {
  const contractBytes = Buffer.from(`${JSON.stringify(validContract)}\n`);
  const manifest = {
    contractVersion: "v1",
    channel: "development",
    sourceRevision: "a".repeat(40),
    sha256: "7c7eeed5a869a4c7acd3e6767f4f574eb089a44e57f6fb09a5eb2235e3eea123",
  };
  manifest.sha256 = createHash("sha256")
    .update(contractBytes)
    .digest("hex");
  assert.doesNotThrow(() => validateManifest(manifest, contractBytes, "development"));
  assert.throws(
    () => validateManifest({ ...manifest, channel: "main" }, contractBytes, "development"),
    /version or channel/,
  );
  assert.throws(
    () => validateManifest(manifest, Buffer.from("tampered"), "development"),
    /digest mismatch/,
  );
  assert.doesNotThrow(() => {
    assertManifestIsCurrent(manifest, manifest.sourceRevision, "development");
  });
  assert.throws(
    () => assertManifestIsCurrent(manifest, "b".repeat(40), "development"),
    /artifact is stale/,
  );
});

test("trusted CI digest accepts the finalized workflow and rejects PR edits", async () => {
  const workflow = await readFile(".github/workflows/ci.yml");
  assert.equal(createHash("sha256").update(workflow).digest("hex"), trustedCiWorkflowSha256);
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
  assert.match(mergeGate, /--signer-workflow github\.com\/MECO-Robotics\/meco-mission-control-platform\/\.github\/workflows\/publish-bootstrap-contract\.yml/);
  assert.match(mergeGate, /--source-digest "\$source_revision"/);
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
