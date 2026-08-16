/// <reference types="jest" />

import { buildCookieRequestOptions } from "../requestOptions";
import {
  clearWebSessionState,
  setSessionCsrfToken,
} from "../sessionStorage";

describe("cookie-authenticated API request options", () => {
  afterEach(() => {
    clearWebSessionState();
  });

  it("includes cookies without replaying an Authorization header", () => {
    const options = buildCookieRequestOptions();
    const headers = new Headers(options.headers);

    expect(options.credentials).toBe("include");
    expect(headers.has("Authorization")).toBe(false);
  });

  it("attaches the in-memory CSRF token to unsafe requests", () => {
    setSessionCsrfToken("csrf-token");

    const options = buildCookieRequestOptions({ method: "POST" });

    expect(new Headers(options.headers).get("X-CSRF-Token")).toBe(
      "csrf-token",
    );
  });

  it("does not attach CSRF to safe or unauthenticated requests", () => {
    setSessionCsrfToken("csrf-token");

    const getOptions = buildCookieRequestOptions();
    const loginOptions = buildCookieRequestOptions({ method: "POST" }, false);

    expect(new Headers(getOptions.headers).has("X-CSRF-Token")).toBe(false);
    expect(new Headers(loginOptions.headers).has("X-CSRF-Token")).toBe(false);
    expect(loginOptions.credentials).toBe("include");
  });
});
