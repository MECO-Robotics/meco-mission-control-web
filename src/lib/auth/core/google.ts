import type { AuthConfig } from "../types";
import { requestApi } from "./request";

let googleScriptPromise: Promise<void> | null = null;

type GoogleTrustedTypesPolicy = {
  createScriptURL: (value: string) => string;
};

type WindowWithGoogleTrustedTypesPolicy = Window & {
  trustedTypes?: {
    createPolicy: (
      name: string,
      rules: {
        createScriptURL: (value: string) => string;
      },
    ) => GoogleTrustedTypesPolicy;
  };
  __mecoGoogleTrustedTypesPolicy?: GoogleTrustedTypesPolicy;
};

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function readLocalGoogleClientIdOverride() {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return null;
  }

  if (!isLocalHostname(window.location.hostname)) {
    return null;
  }

  const override = import.meta.env.VITE_LOCAL_GOOGLE_CLIENT_ID?.trim();
  return override ? override : null;
}

function getGoogleTrustedTypesPolicy() {
  if (typeof window === "undefined") {
    return null;
  }

  const targetWindow = window as WindowWithGoogleTrustedTypesPolicy;
  if (!targetWindow.trustedTypes) {
    return null;
  }

  if (!targetWindow.__mecoGoogleTrustedTypesPolicy) {
    targetWindow.__mecoGoogleTrustedTypesPolicy =
      targetWindow.trustedTypes.createPolicy("meco-mission-control-web-google", {
        createScriptURL: (value: string) => value,
      });
  }

  return targetWindow.__mecoGoogleTrustedTypesPolicy;
}

export function isSecureGoogleAuthHost() {
  if (typeof window === "undefined") {
    return false;
  }

  return isLocalHostname(window.location.hostname) || window.location.protocol === "https:";
}

export function fetchAuthConfig() {
  return requestApi<unknown>("/auth/config").then((payload) => {
    if (!payload || typeof payload !== "object") {
      throw new Error("The server returned an invalid authentication configuration.");
    }

    const candidate = payload as Record<string, unknown>;
    if (
      typeof candidate.enabled !== "boolean" ||
      (typeof candidate.googleClientId !== "string" && candidate.googleClientId !== null) ||
      typeof candidate.hostedDomain !== "string" ||
      typeof candidate.emailEnabled !== "boolean" ||
      (candidate.devBypassAvailable !== undefined &&
        typeof candidate.devBypassAvailable !== "boolean")
    ) {
      throw new Error("The server returned an invalid authentication configuration.");
    }

    const config = candidate as unknown as AuthConfig;
    return {
      ...config,
      devBypassAvailable: config.devBypassAvailable ?? false,
    };
  });
}

export function resolveGoogleClientId(config: AuthConfig | null) {
  if (!config?.enabled || !config.googleClientId) {
    return null;
  }

  return readLocalGoogleClientIdOverride() ?? config.googleClientId;
}

export function isUsingLocalGoogleClientIdOverride() {
  return readLocalGoogleClientIdOverride() !== null;
}

export function isLocalGoogleAuthHost() {
  return typeof window !== "undefined" && isLocalHostname(window.location.hostname);
}

export function signOutFromGoogle() {
  if (window.google?.accounts.id) {
    window.google.accounts.id.disableAutoSelect();
  }
}

export function loadGoogleIdentityScript() {
  if (window.google?.accounts.id) {
    return Promise.resolve();
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Google Identity Services failed to load.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    const scriptUrl = "https://accounts.google.com/gsi/client";
    const trustedScriptUrl = getGoogleTrustedTypesPolicy()?.createScriptURL(scriptUrl);
    script.src = (trustedScriptUrl ?? scriptUrl) as string;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      googleScriptPromise = null;
      reject(new Error("Google Identity Services failed to load."));
    };
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}
