import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";

const source = path.join(path.dirname(fileURLToPath(import.meta.url)), "codex-worktree-bootstrap.mjs");
function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, shell: process.platform === "win32" && command === "npm.cmd" });
    let output = "";
    child.stdout.on("data", (data) => { output += data; });
    child.stderr.on("data", (data) => { output += data; });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, output }));
  });
}

test("bootstrap installs deterministically, reuses valid dependencies and owns only its server", async () => {
  const root = mkdtempSync(path.join(process.env.TMPDIR || tmpdir(), "worktree bootstrap "));
  let pid;
  const occupied = createServer();
  try {
    mkdirSync(path.join(root, "scripts"));
    mkdirSync(path.join(root, "fixture-vite/bin"), { recursive: true });
    copyFileSync(source, path.join(root, "scripts/bootstrap.mjs"));
    writeFileSync(path.join(root, "fixture-vite/package.json"), JSON.stringify({ name: "vite", version: "1.0.0", type: "module" }));
    writeFileSync(path.join(root, "fixture-vite/bin/vite.js"), `import {createServer} from 'node:http';
const args=process.argv; createServer((req,res)=>res.end('ready')).listen(Number(args[args.indexOf('--port')+1]), args[args.indexOf('--host')+1]);`);
    const manifest = path.join(root, "package.json");
    writeFileSync(manifest, JSON.stringify({ name: "bootstrap-fixture", version: "1.0.0", dependencies: { vite: "file:fixture-vite" } }));
    const npm = process.platform === "win32" ? "npm.cmd" : "npm";
    const lock = await run(npm, ["install", "--package-lock-only", "--ignore-scripts", "--no-audit"], root);
    assert.equal(lock.code, 0, lock.output);
    const setup = () => run(process.execPath, ["scripts/bootstrap.mjs", "--setup-only"], root);
    let result = await setup();
    assert.equal(result.code, 0, result.output);
    assert.match(result.output, /installed from the committed lockfile/);
    result = await setup();
    assert.equal(result.code, 0, result.output);
    assert.match(result.output, /skipped npm ci/);
    writeFileSync(manifest, readFileSync(manifest, "utf8") + "\n");
    result = await setup();
    assert.equal(result.code, 0, result.output);
    assert.match(result.output, /installed from the committed lockfile/);
    const stamp = path.join(root, "node_modules/.cache/worktree-bootstrap/dependencies.json");
    writeFileSync(stamp, "incomplete");
    result = await setup();
    assert.equal(result.code, 0, result.output);
    assert.match(result.output, /installed from the committed lockfile/);
    rmSync(path.join(root, "node_modules/vite"), { recursive: true });
    result = await setup();
    assert.equal(result.code, 0, result.output);
    assert.match(result.output, /installed from the committed lockfile/);
    await new Promise((resolve) => occupied.listen(0, "127.0.0.1", resolve));
    const port = occupied.address().port;
    result = await run(process.execPath, ["scripts/bootstrap.mjs", "--port", String(port)], root);
    assert.notEqual(result.code, 0);
    assert.match(result.output, /Cannot use/);
    await new Promise((resolve) => occupied.close(resolve));
    result = await run(process.execPath, ["scripts/bootstrap.mjs", "--port", String(port)], root);
    assert.equal(result.code, 0, result.output);
    pid = Number(result.output.match(/PID (\d+)/)[1]);
    assert.equal(await (await fetch(`http://127.0.0.1:${port}`)).text(), "ready");
    result = await run(process.execPath, ["scripts/bootstrap.mjs", "--port", "invalid"], root);
    assert.notEqual(result.code, 0);
    assert.match(result.output, /Port must be/);
  } finally {
    if (pid) process.kill(pid);
    if (occupied.listening) await new Promise((resolve) => occupied.close(resolve));
    rmSync(root, { recursive: true, force: true });
  }
});
