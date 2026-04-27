import { getGoogleButtonTheme } from "@/app/googleButtonTheme";

describe("getGoogleButtonTheme", () => {
  it("uses a dark filled button for dark mode auth surfaces", () => {
    expect(getGoogleButtonTheme(true)).toBe("filled_black");
  });

  it("keeps the outline button for light mode auth surfaces", () => {
    expect(getGoogleButtonTheme(false)).toBe("outline");
  });
});
