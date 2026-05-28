/// <reference types="jest" />
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("TimelineView today marker", () => {
  it("anchors the today label to the today line and keeps it under timeline labels", () => {
    const source = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/portals/TimelineTodayMarkerPortal.tsx"),
      "utf8",
    );

    expect(source).toContain("zIndex: 10017,");
    expect(source).toContain("zIndex: 1,");
    expect(source).toContain("zIndex: 2,");
    expect(source).toContain("left: 0,");
    expect(source).toContain('transform: showLabelAtTop ? "translate(-50%, -50%)" : "translateX(-50%)"');
    expect(source).not.toContain("todayMarkerLeft - todayMarkerLineLeft");
  });
});
