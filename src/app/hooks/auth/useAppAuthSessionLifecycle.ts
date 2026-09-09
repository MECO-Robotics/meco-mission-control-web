import { useEffect, type Dispatch, type SetStateAction } from "react";

import { clearWebSessionState, getSessionGeneration } from "@/lib/auth/core/sessionStorage";
import {
  restoreWebSession,
  validateSession,
} from "@/lib/auth/session";
import { type AuthConfig, type SessionUser } from "@/lib/auth/types";
import { toErrorMessage } from "@/lib/appUtils/common";
import { fetchAuthConfig } from "@/app/hooks/auth/useAppAuthSessionConfig";

interface UseAppAuthSessionBootstrapArgs {
  setAuthBooting: Dispatch<SetStateAction<boolean>>;
  setAuthConfig: Dispatch<SetStateAction<AuthConfig | null>>;
  setAuthMessage: Dispatch<SetStateAction<string | null>>;
  setSessionUser: Dispatch<SetStateAction<SessionUser | null>>;
}

interface RestoreStoredSessionArgs {
  isCancelled?: () => boolean;
  setSessionUser: Dispatch<SetStateAction<SessionUser | null>>;
}

interface UseAppAuthSessionValidationArgs {
  enforcedAuthConfig: AuthConfig | null;
  expireSession: (message: string) => void;
  sessionUser: SessionUser | null;
}

export async function restoreStoredSession({
  isCancelled = () => false,
  setSessionUser,
}: RestoreStoredSessionArgs) {
  const generation = getSessionGeneration();
  try {
    const { user } = await restoreWebSession();
    if (isCancelled() || generation !== getSessionGeneration()) {
      return;
    }

    setSessionUser(user);
  } catch (error) {
    if (isCancelled() || generation !== getSessionGeneration()) return;
    const isUnauthorized =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      (error as { statusCode?: unknown }).statusCode === 401;
    if (!isUnauthorized) {
      throw error;
    }

    if (isUnauthorized) {
      clearWebSessionState();
    }
  }
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

        if (!config.enabled) {
          setAuthConfig(config);
          return;
        }

        await restoreStoredSession({
          isCancelled: () => cancelled,
          setSessionUser,
        });
        if (cancelled) {
          return;
        }

        setAuthConfig(config);
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

    let cancelled = false;
    const intervalId = window.setInterval(() => {
      void (async () => {
        const generation = getSessionGeneration();
        const isValid = await validateSession();
        if (!cancelled && generation === getSessionGeneration() && !isValid) {
          expireSession("Your session expired. Please sign in again.");
        }
      })();
    }, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [enforcedAuthConfig, expireSession, sessionUser]);
}
