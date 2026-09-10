/// <reference types="jest" />

import { parseLocalDate } from "@/lib/dateUtils";

describe("parseLocalDate", () => {
  it("parses date-only values at local midnight", () => {
    const parsed = parseLocalDate("2026-01-02");

    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(0);
    expect(parsed?.getDate()).toBe(2);
    expect(parsed?.getHours()).toBe(0);
  });

  it("rejects invalid calendar dates", () => {
    expect(parseLocalDate("2026-02-30")).toBeNull();
  });
});
