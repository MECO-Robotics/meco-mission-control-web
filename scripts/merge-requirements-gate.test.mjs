import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertTrustedCiWorkflow,
  assertTrustedCiWorkflowSha256,
} from "./merge-requirements-gate.mjs";

test("retains the previously approved CI digest", () => {
  assert.doesNotThrow(() => assertTrustedCiWorkflowSha256(
    "2660805581abe2cffbb85d3db98a99fa192b20d23624ffa186da04d9c943c894",
  ));
});

test("accepts the exact reviewed cleanup CI digest", () => {
  assert.doesNotThrow(() => assertTrustedCiWorkflowSha256(
    "5686aa7904ff3e24ff56cb1941572511d19dca8e4286c0a14502b7f0ec762fd5",
  ));
});

test("rejects arbitrary and altered digests", () => {
  for (const digest of ["0".repeat(64), "5686aa7904ff3e24ff56cb1941572511d19dca8e4286c0a14502b7f0ec762fd6", ""]) {
    assert.throws(() => assertTrustedCiWorkflowSha256(digest), /workflow digest mismatch/);
  }
});

test("hashes workflow content before checking the exact allowlist", () => {
  assert.throws(() => assertTrustedCiWorkflow(Buffer.from("name: unapproved CI\n")), /workflow digest mismatch/);
});
