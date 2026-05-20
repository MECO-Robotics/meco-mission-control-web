/// <reference types="jest" />

import {
  daysUntilDate,
  isDateOverdue,
  parseAttentionDate,
} from "@/features/workspace/views/attention/attentionViewHelpers";

describe("attentionViewHelpers date parsing", () => {
  it("parses date-only values as local midnight", () => {
    expect(parseAttentionDate("2026-05-09")).toBe(new Date(2026, 4, 9).getTime());
  });

  it("keeps local-day overdue and due-soon math stable", () => {
    const localNoon = new Date(2026, 4, 9, 12, 0, 0);
    expect(isDateOverdue("2026-05-09", localNoon)).toBe(false);
    expect(daysUntilDate("2026-05-10", localNoon)).toBe(1);
  });
});
