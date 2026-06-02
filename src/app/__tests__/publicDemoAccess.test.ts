import { isPublicDemoSeasonAccess } from "@/app/publicDemoAccess";

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
