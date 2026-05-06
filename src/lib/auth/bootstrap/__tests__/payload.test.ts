/// <reference types="jest" />

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { normalizeBootstrapPayload } from "@/lib/auth/bootstrap/payload";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneRequirementRecord } from "@/types/recordsExecution";

describe("normalizeBootstrapPayload", () => {
  it("preserves milestone requirements", () => {
    const milestoneId = "milestone-1";
    const milestoneRequirements: MilestoneRequirementRecord[] = [
      {
        id: "milestone-requirement-1",
        milestoneId,
        targetType: "project",
        targetId: "project-1",
        conditionType: "custom",
        conditionValue: "in_scope",
        required: true,
        sortOrder: 0,
        notes: "Must be in scope",
      },
    ];

    const payload: BootstrapPayload = {
      ...EMPTY_BOOTSTRAP,
      milestones: [
        {
          id: milestoneId,
          title: "Milestone 1",
          type: "internal-review",
          startDateTime: "2026-01-10T12:00:00",
          endDateTime: null,
          isExternal: false,
          description: "",
          projectIds: ["project-1"],
        },
      ],
      milestoneRequirements,
    };

    const normalized = normalizeBootstrapPayload(payload);

    expect(normalized.milestoneRequirements).toEqual(milestoneRequirements);
  });
});
