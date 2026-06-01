/// <reference types="jest" />

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("@/lib/branding", () => ({
  MECO_LOGIN_BACKDROP_SRC: "/backdrop.jpg",
  MECO_MAIN_LOGO_HEIGHT: 40,
  MECO_MAIN_LOGO_LIGHT_SRC: "/logo-light.png",
  MECO_MAIN_LOGO_WHITE_SRC: "/logo-white.png",
  MECO_MAIN_LOGO_WIDTH: 120,
}));

import { DevBypassButton } from "../AuthScreenSections";

describe("DevBypassButton", () => {
  it("exposes local dev student and mentor role choices", () => {
    const markup = renderToStaticMarkup(
      createElement(DevBypassButton, {
        isSigningIn: false,
        onDevBypassSignIn: async () => undefined,
      }),
    );

    expect(markup).toContain("Development sign-in bypass");
    expect(markup).toContain("Continue as local dev");
    expect(markup).toContain("Local dev role switch");
    expect(markup).toContain("Student");
    expect(markup).toContain("Mentor");
    expect(markup).toContain("aria-pressed=\"true\"");
  });
});
