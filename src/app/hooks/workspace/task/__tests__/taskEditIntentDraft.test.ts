/// <reference types="jest" />

import { buildEmptyTaskPayload } from "@/lib/appUtils/taskTargets";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { applyTaskEditIntentToDraft } from "../taskEditIntentDraft";

describe("applyTaskEditIntentToDraft", () => {
  it("adds a blocker placeholder for blocked edit intents", () => {
    const draft = buildEmptyTaskPayload(EMPTY_BOOTSTRAP);

    const updatedDraft = applyTaskEditIntentToDraft(draft, { intentState: "blocked" });

    expect(updatedDraft.taskBlockers).toEqual([
      expect.objectContaining({
        blockerId: null,
        blockerType: "other",
        description: "Blocked",
        isIntentPlaceholder: true,
        severity: "medium",
      }),
    ]);
    expect(updatedDraft.taskDependencies).toEqual([]);
  });

  it("adds an editable hard task dependency for waiting-on-dependency edit intents", () => {
    const draft = buildEmptyTaskPayload(EMPTY_BOOTSTRAP);

    const updatedDraft = applyTaskEditIntentToDraft(draft, {
      intentState: "waiting-on-dependency",
    });

    expect(updatedDraft.taskDependencies).toEqual([
      expect.objectContaining({
        dependencyType: "hard",
        kind: "task",
        refId: "",
        requiredState: "complete",
      }),
    ]);
    expect(updatedDraft.taskBlockers).toEqual([]);
  });

  it("preserves existing draft relations when adding intent context", () => {
    const draft = {
      ...buildEmptyTaskPayload(EMPTY_BOOTSTRAP),
      taskBlockers: [
        {
          id: "blocker-existing",
          blockerId: null,
          blockerType: "shipping-delay" as const,
          description: "Waiting on vendor",
          severity: "high" as const,
        },
      ],
      taskDependencies: [
        {
          id: "dependency-existing",
          dependencyType: "soft" as const,
          kind: "milestone" as const,
          refId: "milestone-1",
          requiredState: "ready",
        },
      ],
    };

    const updatedDraft = applyTaskEditIntentToDraft(draft, { intentState: "blocked" });

    expect(updatedDraft.taskBlockers).toHaveLength(2);
    expect(updatedDraft.taskBlockers?.[0]).toMatchObject({ id: "blocker-existing" });
    expect(updatedDraft.taskDependencies).toEqual(draft.taskDependencies);
  });
});
