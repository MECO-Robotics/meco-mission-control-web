import { useEffect, useRef, useState } from "react";

import {
  type AuthConfig,
  type EmailCodeDeliveryResponse,
  type GoogleCredentialResponse,
  type SessionUser,
} from "@/lib/auth/types";
import {
  isLocalGoogleAuthHost,
  isUsingLocalGoogleClientIdOverride,
  resolveGoogleClientId,
} from "@/app/hooks/auth/useAppAuthGoogleIdentity";
import {
  useAppAuthSessionActions,
  type UseAppAuthSessionActionsResult,
} from "@/app/hooks/auth/useAppAuthSessionActions";
import {
  useAppAuthSessionBootstrap,
  useAppAuthSessionValidation,
} from "@/app/hooks/auth/useAppAuthSessionLifecycle";

interface UseAppAuthSessionArgs {
  resetWorkspace: () => void;
}

export interface UseAppAuthSessionResult {
  authBooting: boolean;
  authConfig: AuthConfig | null;
  authMessage: string | null;
  clearAuthMessage: () => void;
  expireSession: (message: string) => void;
  enforcedAuthConfig: AuthConfig | null;
  googleClientId: string | null;
  handleDevBypassSignIn: () => Promise<void>;
  handleGoogleCredential: (response: GoogleCredentialResponse) => Promise<void>;
  handleRequestEmailCode: (email: string) => Promise<EmailCodeDeliveryResponse>;
  handleSignOut: () => void;
  handleVerifyEmailCode: (email: string, code: string) => Promise<void>;
  hostedDomain: string;
  isEmailAuthAvailable: boolean;
  isGoogleAuthAvailable: boolean;
  isLocalGoogleDevHost: boolean;
  isLocalGoogleOverrideActive: boolean;
  isSigningIn: boolean;
  sessionUser: SessionUser | null;
  setAuthMessage: (message: string) => void;
}

export function useAppAuthSession({
  resetWorkspace,
}: UseAppAuthSessionArgs): UseAppAuthSessionResult {
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [authBooting, setAuthBooting] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const resetWorkspaceRef = useRef(resetWorkspace);

  useEffect(() => {
    resetWorkspaceRef.current = resetWorkspace;
  }, [resetWorkspace]);

  const enforcedAuthConfig = authConfig?.enabled ? authConfig : null;
  const googleClientId = resolveGoogleClientId(authConfig);
  const hostedDomain = enforcedAuthConfig?.hostedDomain ?? "";
  const isGoogleAuthAvailable = Boolean(googleClientId);
  const isEmailAuthAvailable = Boolean(enforcedAuthConfig?.emailEnabled);
  const isLocalGoogleOverrideActive = isUsingLocalGoogleClientIdOverride();
  const isLocalGoogleDevHost = isLocalGoogleAuthHost();
  const {
    clearAuthMessage,
    expireSession,
    handleDevBypassSignIn,
    handleGoogleCredential,
    handleRequestEmailCode,
    handleSignOut,
    handleVerifyEmailCode,
    setAuthMessage: setAuthMessageNow,
  }: UseAppAuthSessionActionsResult = useAppAuthSessionActions({
    resetWorkspaceRef,
    setAuthMessage,
    setIsSigningIn,
    setSessionUser,
  });

  useAppAuthSessionBootstrap({
    setAuthBooting,
    setAuthConfig,
    setAuthMessage,
    setSessionUser,
  });

  useAppAuthSessionValidation({
    enforcedAuthConfig,
    expireSession,
    sessionUser,
  });

  return {
    authBooting,
    authConfig,
    authMessage,
    clearAuthMessage,
    expireSession,
    enforcedAuthConfig,
    googleClientId,
    handleDevBypassSignIn,
    handleGoogleCredential,
    handleRequestEmailCode,
    handleSignOut,
    handleVerifyEmailCode,
    hostedDomain,
    isEmailAuthAvailable,
    isGoogleAuthAvailable,
    isLocalGoogleDevHost,
    isLocalGoogleOverrideActive,
    isSigningIn,
    sessionUser,
    setAuthMessage: setAuthMessageNow,
  };
}
