export interface AuthConfig {
  enabled: boolean;
  googleClientId: string | null;
  hostedDomain: string;
  emailEnabled: boolean;
  devBypassAvailable: boolean;
}

export interface SessionUser {
  accountId: string;
  authProvider: "google" | "email";
  email: string;
  name: string;
  picture: string | null;
  hostedDomain: string;
}

export interface SessionResponse {
  token: string;
  user: SessionUser;
}

export interface EmailCodeDeliveryResponse {
  sentTo: string;
  expiresInMinutes: number;
}

export interface GoogleCredentialResponse {
  credential?: string;
}

export interface MediaUploadResponse {
  expiresInSeconds: number;
  headers: Record<string, string>;
  key: string;
  method: "PUT";
  publicUrl: string;
  uploadUrl: string;
}
