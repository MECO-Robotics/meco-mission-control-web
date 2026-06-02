import {
  isPublicDemoSeasonAccess,
  shouldShowEnforcedSignInScreen,
  shouldResetAuthenticatedPublicDemoSeasonScope,
} from "@/app/publicDemoAccess";

describe("isPublicDemoSeasonAccess", () => {
  const enforcedAuthConfig = { enabled: true };
  const sessionUser = { accountId: "signed-in-user" };

  it("allows unsigned users into the default demo scope", () => {
    expect(
      isPublicDemoSeasonAccess({
        enforcedAuthConfig,
        selectedSeasonId: null,
        sessionUser: null,
      }),
    ).toBe(true);
    expect(
      isPublicDemoSeasonAccess({
        enforcedAuthConfig,
        selectedSeasonId: "default-season",
        sessionUser: null,
      }),
    ).toBe(true);
  });

  it("keeps auth enforced outside the public demo scope", () => {
    expect(
      isPublicDemoSeasonAccess({
        enforcedAuthConfig,
        selectedSeasonId: "season-2030",
        sessionUser: null,
      }),
    ).toBe(false);
    expect(
      isPublicDemoSeasonAccess({
        enforcedAuthConfig: null,
        selectedSeasonId: "default-season",
        sessionUser: null,
      }),
    ).toBe(false);
    expect(
      isPublicDemoSeasonAccess({
        enforcedAuthConfig,
        selectedSeasonId: "default-season",
        sessionUser,
      }),
    ).toBe(false);
  });
});

describe("shouldResetAuthenticatedPublicDemoSeasonScope", () => {
  const sessionUser = { accountId: "signed-in-user" };

  it("resets the public demo season sentinel after sign-in", () => {
    expect(
      shouldResetAuthenticatedPublicDemoSeasonScope({
        selectedSeasonId: "default-season",
        sessionUser,
      }),
    ).toBe(true);
  });

  it("keeps non-demo and signed-out season scopes intact", () => {
    expect(
      shouldResetAuthenticatedPublicDemoSeasonScope({
        selectedSeasonId: "season-2030",
        sessionUser,
      }),
    ).toBe(false);
    expect(
      shouldResetAuthenticatedPublicDemoSeasonScope({
        selectedSeasonId: "default-season",
        sessionUser: null,
      }),
    ).toBe(false);
  });
});

describe("shouldShowEnforcedSignInScreen", () => {
  const enforcedAuthConfig = { enabled: true };
  const sessionUser = { accountId: "signed-in-user" };

  it("keeps the sign-in screen hidden for unsigned public demo access by default", () => {
    expect(
      shouldShowEnforcedSignInScreen({
        enforcedAuthConfig,
        isPublicDemoSession: true,
        isSignInScreenRequested: false,
        sessionUser: null,
      }),
    ).toBe(false);
  });

  it("shows sign-in for public demo access after an expired session requests it", () => {
    expect(
      shouldShowEnforcedSignInScreen({
        enforcedAuthConfig,
        isPublicDemoSession: true,
        isSignInScreenRequested: true,
        sessionUser: null,
      }),
    ).toBe(true);
  });

  it("shows sign-in for unsigned non-demo access and hides it for signed-in users", () => {
    expect(
      shouldShowEnforcedSignInScreen({
        enforcedAuthConfig,
        isPublicDemoSession: false,
        isSignInScreenRequested: false,
        sessionUser: null,
      }),
    ).toBe(true);

    expect(
      shouldShowEnforcedSignInScreen({
        enforcedAuthConfig,
        isPublicDemoSession: true,
        isSignInScreenRequested: true,
        sessionUser,
      }),
    ).toBe(false);
  });
});
