import {
  startTransition,
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";

import {
  clearStoredSessionToken,
  exchangeGoogleCredential,
  fetchAuthConfig,
  fetchCurrentUser,
  isLocalGoogleAuthHost,
  isUsingLocalGoogleClientIdOverride,
  isSecureGoogleAuthHost,
  loadGoogleIdentityScript,
  loadStoredSessionToken,
  resolveGoogleClientId,
  requestEmailSignInCode,
  requestDevBypassSignIn,
  signOutFromGoogle,
  storeSessionToken,
  verifyEmailSignInCode,
  type AuthConfig,
  type EmailCodeDeliveryResponse,
  type GoogleCredentialResponse,
  type SessionUser,
  validateSession,
} from "@/lib/auth";
import { toErrorMessage } from "@/lib/appUtils";
import { getGoogleButtonTheme } from "@/app/googleButtonTheme";

interface UseAppAuthArgs {
  resetWorkspace: () => void;
  isDarkMode: boolean;
}

export function useAppAuth({ isDarkMode, resetWorkspace }: UseAppAuthArgs) {
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [authBooting, setAuthBooting] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const enforcedAuthConfig = authConfig?.enabled ? authConfig : null;
  const googleClientId = resolveGoogleClientId(authConfig);
  const hostedDomain = enforcedAuthConfig?.hostedDomain ?? "";
  const isGoogleAuthHostAllowed = isSecureGoogleAuthHost();
  const isGoogleAuthAvailable = Boolean(googleClientId);
  const isEmailAuthAvailable = Boolean(enforcedAuthConfig?.emailEnabled);
  const isLocalGoogleOverrideActive = isUsingLocalGoogleClientIdOverride();
  const isLocalGoogleDevHost = isLocalGoogleAuthHost();
  const resetWorkspaceRef = useRef(resetWorkspace);

  useEffect(() => {
    resetWorkspaceRef.current = resetWorkspace;
  }, [resetWorkspace]);

  const expireSession = useCallback((message: string) => {
    clearStoredSessionToken();
    signOutFromGoogle();
    resetWorkspaceRef.current();
    startTransition(() => {
      setSessionUser(null);
    });
    setAuthMessage(message);
  }, []);

  const handleGoogleCredential = useEffectEvent(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        setAuthMessage("Google did not return a credential to verify.");
        return;
      }

      setIsSigningIn(true);
      setAuthMessage(null);

      try {
        const session = await exchangeGoogleCredential(response.credential);
        storeSessionToken(session.token);
        startTransition(() => {
          setSessionUser(session.user);
        });
      } catch (error) {
        clearStoredSessionToken();
        setAuthMessage(toErrorMessage(error));
      } finally {
        setIsSigningIn(false);
      }
    },
  );

  const clearAuthMessage = useCallback(() => {
    setAuthMessage(null);
  }, []);

  const handleRequestEmailCode = useCallback(
    async (email: string): Promise<EmailCodeDeliveryResponse> => {
      setIsSigningIn(true);
      setAuthMessage(null);

      try {
        return await requestEmailSignInCode(email);
      } catch (error) {
        setAuthMessage(toErrorMessage(error));
        throw error;
      } finally {
        setIsSigningIn(false);
      }
    },
    [],
  );

  const handleVerifyEmailCode = useCallback(
    async (email: string, code: string) => {
      setIsSigningIn(true);
      setAuthMessage(null);

      try {
        const session = await verifyEmailSignInCode(email, code);
        storeSessionToken(session.token);
        startTransition(() => {
          setSessionUser(session.user);
        });
      } catch (error) {
        clearStoredSessionToken();
        setAuthMessage(toErrorMessage(error));
        throw error;
      } finally {
        setIsSigningIn(false);
      }
    },
    [],
  );

  const handleDevBypassSignIn = useCallback(async () => {
    setIsSigningIn(true);
    setAuthMessage(null);

    try {
      const session = await requestDevBypassSignIn();
      storeSessionToken(session.token);
      startTransition(() => {
        setSessionUser(session.user);
      });
    } catch (error) {
      clearStoredSessionToken();
      setAuthMessage(toErrorMessage(error));
    } finally {
      setIsSigningIn(false);
    }
  }, []);

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

          startTransition(() => {
            setSessionUser(user);
          });
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
  }, []);

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

  useEffect(() => {
    if (authBooting || sessionUser || !googleClientId) {
      return;
    }

    const buttonSlot = googleButtonRef.current;
    if (!buttonSlot) {
      return;
    }

    if (!isGoogleAuthHostAllowed) {
      setAuthMessage(
        "Google SSO is unavailable from this host. Google web sign-in requires HTTPS for non-localhost origins.",
      );
      return;
    }

    let cancelled = false;
    const activeGoogleClientId = googleClientId;

    async function setupGoogleButton() {
      try {
        await loadGoogleIdentityScript();
        const activeButtonSlot = googleButtonRef.current;
        if (cancelled || !window.google || !activeButtonSlot) {
          return;
        }

        activeButtonSlot.replaceChildren();
        window.google.accounts.id.initialize({
          client_id: activeGoogleClientId,
          callback: (response) => {
            void handleGoogleCredential(response);
          },
          error_callback: (error) => {
            const errorType =
              typeof error === "object" &&
              error !== null &&
              "type" in error &&
              typeof error.type === "string"
                ? error.type
                : null;
            const suffix =
              errorType === "origin_mismatch"
                ? " (origin mismatch: check Google OAuth client allowed origins)"
                : "";
            setAuthMessage(`Google sign-in could not be initialized.${suffix}`);
          },
          hd: hostedDomain || undefined,
          ux_mode: "popup",
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.renderButton(activeButtonSlot, {
          type: "standard",
          theme: getGoogleButtonTheme(isDarkMode),
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: 240,
          logo_alignment: "left",
        });
      } catch (error) {
        if (!cancelled) {
          setAuthMessage(toErrorMessage(error));
        }
      }
    }

    void setupGoogleButton();

    return () => {
      cancelled = true;
      buttonSlot.replaceChildren();
    };
  }, [authBooting, googleClientId, hostedDomain, isDarkMode, isGoogleAuthHostAllowed, sessionUser]);

  const handleSignOut = useCallback(() => {
    clearStoredSessionToken();
    signOutFromGoogle();
    startTransition(() => {
      setSessionUser(null);
    });
    setAuthMessage(null);
    resetWorkspaceRef.current();
  }, []);

  return {
    authBooting,
    authConfig,
    authMessage,
    clearAuthMessage,
    enforcedAuthConfig,
    expireSession,
    googleButtonRef,
    handleSignOut,
    handleRequestEmailCode,
    handleVerifyEmailCode,
    handleDevBypassSignIn,
    isEmailAuthAvailable,
    isLocalGoogleDevHost,
    isLocalGoogleOverrideActive,
    isGoogleAuthAvailable,
    isSigningIn,
    sessionUser,
  };
}
