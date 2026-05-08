/// <reference types="jest" />

import { toEventDateKey } from "@/features/workspace/views/taskCalendar/taskCalendarLayout";

describe("toEventDateKey", () => {
  it("keeps calendar-date values stable", () => {
    expect(toEventDateKey("2026-04-20")).toBe("2026-04-20");
  });

  it("keeps utc timestamped events on the intended day", () => {
    expect(toEventDateKey("2026-04-20T00:00:00.000Z")).toBe("2026-04-20");
  });

  it("falls back to parsed UTC date for non-ISO strings", () => {
    expect(toEventDateKey("Mon, 20 Apr 2026 00:00:00 GMT")).toBe("2026-04-20");
  });
});
