/// <reference types="jest" />

import { buildMilestoneSearchSuggestions } from "@/features/workspace/views/milestones/milestonesViewUtils";
import { createBootstrap } from "./milestoneFixture";

describe("milestone search suggestions", () => {
  it("builds contextual suggestions for milestone search matches", () => {
      const bootstrap = createBootstrap();
      const suggestions = buildMilestoneSearchSuggestions({
        milestones: bootstrap.milestones,
        projectLabelByMilestoneId: {
          "milestone-1": "Robot",
          "milestone-2": "Robot",
        },
        searchFilter: "robot",
      });

      expect(suggestions).toEqual([
        expect.objectContaining({
          context: expect.stringContaining("Competition"),
          description: "Competition readiness checkpoint",
          id: "milestone-1",
          title: "Regional",
        }),
        expect.objectContaining({
          context: expect.stringContaining("Planned"),
          id: "milestone-2",
          title: "Design review",
        }),
      ]);
      expect(suggestions[0]?.context).toContain("Robot");
      expect(suggestions[0]?.context).toContain("Mar 10");
    });
});
