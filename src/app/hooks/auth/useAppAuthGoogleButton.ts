import { useEffect, useRef } from "react";

import { getGoogleButtonTheme } from "@/app/theme/googleButtonTheme";
import {
  isSecureGoogleAuthHost,
  loadGoogleIdentityScript,
  type GoogleIdentityWindow,
} from "@/app/hooks/auth/useAppAuthGoogleIdentity";
import { type GoogleCredentialResponse, type SessionUser } from "@/lib/auth/types";
import { toErrorMessage } from "@/lib/appUtils/common";

interface UseAppAuthGoogleButtonArgs {
  authBooting: boolean;
  googleClientId: string | null;
  handleGoogleCredential: (response: GoogleCredentialResponse) => Promise<void>;
  hostedDomain: string;
  isDarkMode: boolean;
  onAuthMessage: (message: string) => void;
  sessionUser: SessionUser | null;
}

export function useAppAuthGoogleButton({
  authBooting,
  googleClientId,
  handleGoogleCredential,
  hostedDomain,
  isDarkMode,
  onAuthMessage,
  sessionUser,
}: UseAppAuthGoogleButtonArgs) {
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (authBooting || sessionUser || !googleClientId) {
      return;
    }

    const buttonSlot = googleButtonRef.current;
    if (!buttonSlot) {
      return;
    }

    if (!isSecureGoogleAuthHost()) {
      onAuthMessage(
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
        const googleWindow = window as GoogleIdentityWindow;
        if (cancelled || !googleWindow.google || !activeButtonSlot) {
          return;
        }

        activeButtonSlot.replaceChildren();
        googleWindow.google.accounts.id.initialize({
          client_id: activeGoogleClientId,
          callback: (response) => {
            void handleGoogleCredential(response as GoogleCredentialResponse);
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
            onAuthMessage(`Google sign-in could not be initialized.${suffix}`);
          },
          hd: hostedDomain || undefined,
          ux_mode: "popup",
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        googleWindow.google.accounts.id.renderButton(activeButtonSlot, {
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
          onAuthMessage(toErrorMessage(error));
        }
      }
    }

    void setupGoogleButton();

    return () => {
      cancelled = true;
      buttonSlot.replaceChildren();
    };
  }, [
    authBooting,
    googleClientId,
    handleGoogleCredential,
    hostedDomain,
    isDarkMode,
    onAuthMessage,
    sessionUser,
  ]);

  return googleButtonRef;
}
