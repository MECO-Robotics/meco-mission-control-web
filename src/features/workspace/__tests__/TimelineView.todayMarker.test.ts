/// <reference types="jest" />
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("TimelineView today marker", () => {
  it("keeps the today label top-anchored in week and month views", () => {
    const source = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineView.tsx"),
      "utf8",
    );

    expect(source).toContain("showLabelAtTop={true}");
  });
});
