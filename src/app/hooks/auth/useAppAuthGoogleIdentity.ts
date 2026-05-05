import { type AuthConfig } from "@/lib/auth/types";

type GoogleTrustedTypesPolicy = {
  createScriptURL: (value: string) => string;
};

type GoogleIdentityNamespace = {
  accounts: {
    id: {
      disableAutoSelect: () => void;
      initialize: (options: {
        auto_select: boolean;
        callback: (response: unknown) => void;
        cancel_on_tap_outside: boolean;
        client_id: string;
        error_callback: (error: unknown) => void;
        hd?: string;
        ux_mode: "popup";
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: {
          logo_alignment: "left";
          shape: "pill";
          size: "large";
          text: "continue_with";
          theme: string;
          type: "standard";
          width: number;
        },
      ) => void;
    };
  };
};

export type GoogleIdentityWindow = Window & {
  google?: GoogleIdentityNamespace;
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

let googleScriptPromise: Promise<void> | null = null;

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

  const targetWindow = window as GoogleIdentityWindow;
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

function getGoogleWindow() {
  return window as GoogleIdentityWindow;
}

export function isSecureGoogleAuthHost() {
  if (typeof window === "undefined") {
    return false;
  }

  return isLocalHostname(window.location.hostname) || window.location.protocol === "https:";
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
  getGoogleWindow().google?.accounts.id.disableAutoSelect();
}

export function loadGoogleIdentityScript() {
  const googleWindow = getGoogleWindow();
  if (googleWindow.google?.accounts.id) {
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
