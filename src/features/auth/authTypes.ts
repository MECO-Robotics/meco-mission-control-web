import { type CSSProperties, type RefObject } from "react";

import type { AuthConfig, EmailCodeDeliveryResponse } from "@/lib/auth/types";

export interface AuthStatusScreenProps {
  body: string;
  eyebrow?: string;
  isDarkMode?: boolean;
  message?: string | null;
  shellStyle?: CSSProperties;
  title: string;
}

export interface SignInScreenProps {
  authMessage: string | null;
  clearAuthMessage: () => void;
  googleButtonRef: RefObject<HTMLDivElement | null>;
  hasEmailSignIn: boolean;
  hasGoogleSignIn: boolean;
  isDarkMode?: boolean;
  isSigningIn: boolean;
  onDevBypassSignIn: () => Promise<void>;
  onRequestEmailCode: (email: string) => Promise<EmailCodeDeliveryResponse>;
  onVerifyEmailCode: (email: string, code: string) => Promise<void>;
  shellStyle?: CSSProperties;
  signInConfig: AuthConfig;
}
