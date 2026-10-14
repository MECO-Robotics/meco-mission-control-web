/// <reference types="jest" />

import {
  isDateOverdue,
  parseAttentionDate,
} from "@/features/workspace/views/attention/attentionViewHelpers";

describe("attentionViewHelpers date parsing", () => {
  it("parses date-only values as local midnight", () => {
    expect(parseAttentionDate("2026-05-09")).toBe(new Date(2026, 4, 9).getTime());
  });

  it("preserves integer-token date parsing for noncanonical local dates", () => {
    expect(parseAttentionDate("2026-5 -9")).toBe(new Date(2026, 4, 9).getTime());
  });

  it("keeps the existing date-parser fallback for invalid calendar dates", () => {
    expect(parseAttentionDate("2026-02-30")).toBe(new Date("2026-02-30").getTime());
  });

  it("keeps local-day overdue math stable", () => {
    const localNoon = new Date(2026, 4, 9, 12, 0, 0);
    expect(isDateOverdue("2026-05-09", localNoon)).toBe(false);
    expect(isDateOverdue("2026-05-08", localNoon)).toBe(true);
  });
});
