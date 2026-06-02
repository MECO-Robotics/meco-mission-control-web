import {
  isPublicDemoSeasonAccess,
  isPublicDemoWorkspaceSession,
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

describe("isPublicDemoWorkspaceSession", () => {
  const enforcedAuthConfig = { enabled: true };

  it("does not enter public demo while sign-in is explicitly requested", () => {
    expect(
      isPublicDemoWorkspaceSession({
        enforcedAuthConfig,
        isSignInScreenRequested: true,
        selectedSeasonId: null,
        sessionUser: null,
      }),
    ).toBe(false);
  });

  it("allows public demo when eligible and sign-in is not requested", () => {
    expect(
      isPublicDemoWorkspaceSession({
        enforcedAuthConfig,
        isSignInScreenRequested: false,
        selectedSeasonId: null,
        sessionUser: null,
      }),
    ).toBe(true);
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
