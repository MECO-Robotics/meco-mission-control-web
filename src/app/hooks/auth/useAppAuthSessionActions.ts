import {
  startTransition,
  useCallback,
  type RefObject,
  type Dispatch,
  type SetStateAction,
} from "react";

import { beginSessionChange, clearWebSessionState, getSessionGeneration, setPendingSignOut } from "@/lib/auth/core/sessionStorage";
import {
  exchangeGoogleCredential,
  requestDevBypassSignIn,
  requestEmailSignInCode,
  revokeWebSession,
  verifyEmailSignInCode,
} from "@/lib/auth/session";
import {
  type DevBypassRole,
  type EmailCodeDeliveryResponse,
  type GoogleCredentialResponse,
  type SessionUser,
} from "@/lib/auth/types";
import { signOutFromGoogle } from "@/app/hooks/auth/useAppAuthGoogleIdentity";
import { toErrorMessage } from "@/lib/appUtils/common";

interface UseAppAuthSessionActionsArgs {
  onSessionExpired?: () => void;
  resetWorkspaceRef: RefObject<() => void>;
  setAuthMessage: Dispatch<SetStateAction<string | null>>;
  setIsSigningIn: Dispatch<SetStateAction<boolean>>;
  setIsSignInForced: Dispatch<SetStateAction<boolean>>;
  setSessionUser: Dispatch<SetStateAction<SessionUser | null>>;
}

export const UNCONFIRMED_SIGN_OUT_MESSAGE =
  "Your local session was cleared, but server sign-out could not be confirmed. Please retry when connected.";

export interface UseAppAuthSessionActionsResult {
  clearAuthMessage: () => void;
  expireSession: (message: string) => void;
  handleDevBypassSignIn: (role?: DevBypassRole) => Promise<void>;
  handleGoogleCredential: (response: GoogleCredentialResponse) => Promise<void>;
  handleRequestEmailCode: (email: string) => Promise<EmailCodeDeliveryResponse>;
  handleSignOut: () => Promise<void>;
  handleVerifyEmailCode: (email: string, code: string) => Promise<void>;
  setAuthMessage: (message: string) => void;
}

function storeSignedInSession(
  session: { user: SessionUser },
  setSessionUser: Dispatch<SetStateAction<SessionUser | null>>,
) {
  startTransition(() => {
    setSessionUser(session.user);
  });
}

export async function revokeThenClearWebSession(
  clearLocalSession: () => void,
  onUnconfirmed: (message: string) => void = () => undefined,
) {
  setPendingSignOut(true);
  const generation = beginSessionChange();
  let confirmed = false;
  let ownsCompletion: boolean;

  try {
    await revokeWebSession();
    confirmed = true;
  } catch {
    if (generation !== getSessionGeneration()) return false;
    try {
      await revokeWebSession();
      confirmed = true;
    } catch {
      // Local state still clears below, but the server session may remain live.
    }
  } finally {
    ownsCompletion = generation === getSessionGeneration();
    if (ownsCompletion) clearLocalSession();
  }

  if (!ownsCompletion) return false;
  if (confirmed) setPendingSignOut(false);

  if (!confirmed) {
    onUnconfirmed(UNCONFIRMED_SIGN_OUT_MESSAGE);
  }

  return confirmed;
}

export function useAppAuthSessionActions({
  onSessionExpired,
  resetWorkspaceRef,
  setAuthMessage,
  setIsSigningIn,
  setIsSignInForced,
  setSessionUser,
}: UseAppAuthSessionActionsArgs): UseAppAuthSessionActionsResult {
  const clearAuthMessage = useCallback(() => {
    setAuthMessage(null);
  }, [setAuthMessage]);

  const setAuthMessageNow = useCallback(
    (message: string) => {
      setAuthMessage(message);
    },
    [setAuthMessage],
  );

  const expireSession = useCallback(
    (message: string) => {
      clearWebSessionState();
      signOutFromGoogle();
      resetWorkspaceRef.current?.();
      startTransition(() => {
        setSessionUser(null);
      });
      onSessionExpired?.();
      setAuthMessage(message);
    },
    [onSessionExpired, resetWorkspaceRef, setAuthMessage, setSessionUser],
  );

  const handleGoogleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        setAuthMessage("Google did not return a credential to verify.");
        return;
      }

      setIsSigningIn(true);
      setAuthMessage(null);

      try {
        const session = await exchangeGoogleCredential(response.credential);
        setIsSignInForced(false);
        storeSignedInSession(session, setSessionUser);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        clearWebSessionState();
        setAuthMessage(toErrorMessage(error));
      } finally {
        setIsSigningIn(false);
      }
    },
    [setAuthMessage, setIsSignInForced, setIsSigningIn, setSessionUser],
  );

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
    [setAuthMessage, setIsSigningIn],
  );

  const handleVerifyEmailCode = useCallback(
    async (email: string, code: string) => {
      setIsSigningIn(true);
      setAuthMessage(null);

      try {
        const session = await verifyEmailSignInCode(email, code);
        setIsSignInForced(false);
        storeSignedInSession(session, setSessionUser);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        clearWebSessionState();
        setAuthMessage(toErrorMessage(error));
        throw error;
      } finally {
        setIsSigningIn(false);
      }
    },
    [setAuthMessage, setIsSignInForced, setIsSigningIn, setSessionUser],
  );

  const handleDevBypassSignIn = useCallback(
    async (role: DevBypassRole = "student") => {
      setIsSigningIn(true);
      setAuthMessage(null);

      try {
        const session = await requestDevBypassSignIn(role);
        setIsSignInForced(false);
        storeSignedInSession(session, setSessionUser);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        clearWebSessionState();
        setAuthMessage(toErrorMessage(error));
      } finally {
        setIsSigningIn(false);
      }
    },
    [setAuthMessage, setIsSignInForced, setIsSigningIn, setSessionUser],
  );

  const handleSignOut = useCallback(async () => {
    await revokeThenClearWebSession(
      () => {
        clearWebSessionState();
        signOutFromGoogle();
        startTransition(() => {
          setSessionUser(null);
        });
        setAuthMessage(null);
        resetWorkspaceRef.current?.();
      },
      (message) => {
        setAuthMessage(message);
        setIsSignInForced(true);
      },
    );
  }, [resetWorkspaceRef, setAuthMessage, setIsSignInForced, setSessionUser]);

  return {
    clearAuthMessage,
    expireSession,
    handleDevBypassSignIn,
    handleGoogleCredential,
    handleRequestEmailCode,
    handleSignOut,
    handleVerifyEmailCode,
    setAuthMessage: setAuthMessageNow,
  };
}
