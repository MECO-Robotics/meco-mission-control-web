import { defineConfig, loadEnv, type Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// OCCT's Embind bindings require dynamic functions. Scope that allowance to
// the worker response; it cannot execute in the document or spawn workers.
const cadWorkerPolicy = "default-src 'none'; script-src 'self' 'unsafe-eval'; connect-src 'self'; worker-src 'none'; object-src 'none';";
function cadWorkerHeaders(): Plugin {
  const middleware = (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    const path = request.url?.split("?")[0] ?? "";
    if (path === "/src/features/workspace/views/cad/viewer/cadStep.worker.ts"
      || /^\/assets\/cadStep\.worker-[\w-]+\.js$/.test(path)) {
      const setHeader = response.setHeader.bind(response);
      response.setHeader = (name, value) => setHeader(name,
        name.toLowerCase() === "content-security-policy" ? cadWorkerPolicy : value);
      response.setHeader("Content-Security-Policy", cadWorkerPolicy);
    }
    next();
  };
  return {
    name: "cad-worker-policy",
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_DEV_PROXY_TARGET?.trim() || "http://localhost:8080";
  const devHost = env.VITE_DEV_SERVER_HOST?.trim() || "127.0.0.1";
  const rawDevPort = env.VITE_DEV_SERVER_PORT?.trim();
  const parsedDevPort = rawDevPort ? Number.parseInt(rawDevPort, 10) : NaN;
  const devPort = Number.isNaN(parsedDevPort) ? undefined : parsedDevPort;
  const securityHeaders = {
    "Content-Security-Policy":
      "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; require-trusted-types-for 'script'; trusted-types meco-mission-control-web-google goog#html meco-cad-worker; script-src 'self' https://accounts.google.com https://apis.google.com; script-src-attr 'none'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.googleusercontent.com; connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com; frame-src https://accounts.google.com;",
    "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "SAMEORIGIN",
  };
  const apiProxy = {
    "/api": {
      target: proxyTarget,
      changeOrigin: true,
    },
  };

  return {
    plugins: [react(), cadWorkerHeaders()],
    // HMR is disabled for CSP parity; discover lazy viewer dependencies up front
    // so opening a model cannot replace React's optimized module mid-session.
    optimizeDeps: { include: ["@react-three/fiber", "@react-three/drei", "three", "occt-import-js"] },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      headers: securityHeaders,
      // React Fast Refresh injects an inline bootstrap script. Disable HMR so
      // local development enforces the same no-inline-script boundary as prod.
      hmr: false,
      host: devHost,
      port: devPort,
      proxy: apiProxy,
    },
    preview: {
      headers: securityHeaders,
      proxy: apiProxy,
    },
  };
});
