import { requestApi } from "@/lib/auth/core/request";
import { type AuthConfig } from "@/lib/auth/types";

export function fetchAuthConfig(): Promise<AuthConfig> {
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

    return {
      enabled: candidate.enabled as boolean,
      googleClientId: candidate.googleClientId as string | null,
      hostedDomain: candidate.hostedDomain as string,
      emailEnabled: candidate.emailEnabled as boolean,
      devBypassAvailable: (candidate.devBypassAvailable as boolean | undefined) ?? false,
    };
  });
}
