import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync, openSync, closeSync } from "node:fs";
import { createServer } from "node:net";
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { values } = parseArgs({ options: {
  host: { type: "string", default: "127.0.0.1" },
  port: { type: "string", default: "5173" },
  "setup-only": { type: "boolean", default: false },
} });
const port = Number(values.port);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Port must be between 1 and 65535.");
if (Number(process.versions.node.split(".")[0]) !== 22) throw new Error("Use Node.js 22 (see .nvmrc).");
const cache = path.join(root, "node_modules", ".cache", "worktree-bootstrap");
const stamp = path.join(cache, "dependencies.json");
const installedLock = path.join(root, "node_modules", ".package-lock.json");
const hash = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
const fingerprint = JSON.stringify({
  manifest: hash(path.join(root, "package.json")),
  lock: hash(path.join(root, "package-lock.json")),
  node: process.version, platform: process.platform, arch: process.arch,
});
const poolCache = "/mnt/zfs-storage/All Drives/Brian Data/mission-control-cache/npm";
const env = { ...process.env };
if (!env.npm_config_cache && !env.NPM_CONFIG_CACHE && existsSync(path.dirname(poolCache))) env.npm_config_cache = poolCache;
// Windows requires cmd.exe for npm.cmd; all shell arguments here are fixed literals.
const npm = (args, stdio) => spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", args, {
  cwd: root, env, stdio, shell: process.platform === "win32",
});

async function assertPortAvailable() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", (error) => reject(new Error(`Cannot use ${values.host}:${port}: ${error.message}`)));
    server.listen(port, values.host, resolve);
  });
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
if (!values["setup-only"]) await assertPortAvailable();
let current;
try { current = JSON.parse(readFileSync(stamp, "utf8")); } catch { /* First or incomplete setup. */ }
const warm = current?.fingerprint === fingerprint && existsSync(installedLock)
  && current.installedLock === hash(installedLock)
  && npm(["ls", "--depth=0", "--silent"], "ignore").status === 0;
if (!warm) {
  const result = npm(["ci"], "inherit");
  if (result.error || result.status !== 0) throw new Error(`npm ci failed: ${result.error?.message ?? result.status}`);
  mkdirSync(cache, { recursive: true });
  writeFileSync(stamp, JSON.stringify({ fingerprint, installedLock: hash(installedLock) }));
  console.log("Dependencies installed from the committed lockfile.");
} else console.log("Dependencies unchanged; skipped npm ci.");

if (!values["setup-only"]) {
  mkdirSync(cache, { recursive: true });
  const log = path.join(cache, "vite.log");
  const fd = openSync(log, "a");
  const child = spawn(process.execPath, [path.join(root, "node_modules/vite/bin/vite.js"),
    "--host", values.host, "--port", String(port), "--strictPort"], {
    cwd: root, env, detached: true, stdio: ["ignore", fd, fd],
  });
  closeSync(fd);
  let failure;
  child.on("error", (error) => { failure = error; });
  child.unref();
  const probeHost = ["0.0.0.0", "::"].includes(values.host) ? "127.0.0.1" : values.host;
  const url = `http://${probeHost.includes(":") ? `[${probeHost}]` : probeHost}:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (failure || child.exitCode !== null) break;
    try { ready = (await fetch(url, { signal: AbortSignal.timeout(500) })).ok; } catch { /* Starting. */ }
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) {
    child.kill();
    throw new Error(`Vite failed to become ready. See ${log}. ${failure?.message ?? ""}`);
  }
  console.log(`Dev server ready: ${url} (PID ${child.pid}). Log: ${log}`);
}
