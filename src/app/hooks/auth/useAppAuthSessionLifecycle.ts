import { useEffect, type Dispatch, type SetStateAction } from "react";

import { clearStoredSessionToken, loadStoredSessionToken } from "@/lib/auth/core/sessionStorage";
import { fetchCurrentUser } from "@/lib/auth/core/request";
import { validateSession } from "@/lib/auth/session";
import { type AuthConfig, type SessionUser } from "@/lib/auth/types";
import { toErrorMessage } from "@/lib/appUtils/common";
import { fetchAuthConfig } from "@/app/hooks/auth/useAppAuthSessionConfig";

interface UseAppAuthSessionBootstrapArgs {
  setAuthBooting: Dispatch<SetStateAction<boolean>>;
  setAuthConfig: Dispatch<SetStateAction<AuthConfig | null>>;
  setAuthMessage: Dispatch<SetStateAction<string | null>>;
  setSessionUser: Dispatch<SetStateAction<SessionUser | null>>;
}

interface UseAppAuthSessionValidationArgs {
  enforcedAuthConfig: AuthConfig | null;
  expireSession: (message: string) => void;
  sessionUser: SessionUser | null;
}

export function useAppAuthSessionBootstrap({
  setAuthBooting,
  setAuthConfig,
  setAuthMessage,
  setSessionUser,
}: UseAppAuthSessionBootstrapArgs) {
  useEffect(() => {
    let cancelled = false;

    async function bootstrapAuth() {
      try {
        const config = await fetchAuthConfig();
        if (cancelled) {
          return;
        }

        setAuthConfig(config);

        if (!config.enabled) {
          return;
        }

        const storedToken = loadStoredSessionToken();
        if (!storedToken) {
          return;
        }

        try {
          const user = await fetchCurrentUser(storedToken);
          if (cancelled) {
            return;
          }

          setSessionUser(user);
        } catch {
          clearStoredSessionToken();
        }
      } catch (error) {
        if (!cancelled) {
          setAuthMessage(toErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setAuthBooting(false);
        }
      }
    }

    void bootstrapAuth();

    return () => {
      cancelled = true;
    };
  }, [setAuthBooting, setAuthConfig, setAuthMessage, setSessionUser]);
}

export function useAppAuthSessionValidation({
  enforcedAuthConfig,
  expireSession,
  sessionUser,
}: UseAppAuthSessionValidationArgs) {
  useEffect(() => {
    if (!sessionUser || !enforcedAuthConfig) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void (async () => {
        const isValid = await validateSession();
        if (!isValid) {
          expireSession("Your session expired. Please sign in again.");
        }
      })();
    }, 5 * 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enforcedAuthConfig, expireSession, sessionUser]);
}
