import { spawn, spawnSync } from "node:child_process";
import { openSync, closeSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const host = process.env.WEB_HOST || "127.0.0.1";
const port = process.env.WEB_PORT || "5173";
if (!/^[\w.:-]+$/.test(host) || !/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
  throw new Error("WEB_HOST must be a hostname or IP address and WEB_PORT must be a valid port.");
}

const windows = process.platform === "win32";
const npm = windows ? "npm.cmd" : "npm";
const install = spawnSync(npm, ["ci", "--no-audit", "--no-fund"], { cwd: root, stdio: "inherit", shell: windows });
if (install.error) throw install.error;
if (install.status !== 0) process.exit(install.status ?? 1);

const log = openSync(new URL("../codex-web.log", import.meta.url), "a");
const server = spawn(npm, ["run", "dev", "--", "--host", host, "--port", port, "--strictPort"], {
  cwd: root,
  detached: true,
  stdio: ["ignore", log, log],
  shell: windows,
});
closeSync(log);
server.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
server.on("spawn", () => {
  server.unref();
  console.log(`Dev server started (PID ${server.pid}): http://${host}:${port}. See codex-web.log for startup output.`);
});
