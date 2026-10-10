/// <reference types="jest" />

import { buildEmptyTaskPayload } from "@/lib/appUtils/taskTargets";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { applyTaskEditIntentToDraft } from "../taskEditIntentDraft";

describe("applyTaskEditIntentToDraft", () => {
  it("does not create a duplicate blocker record for a blocked intent", () => {
    const draft = buildEmptyTaskPayload(EMPTY_BOOTSTRAP);
    expect(applyTaskEditIntentToDraft(draft, { intentState: "blocked" })).toEqual(draft);
  });

  it("adds an editable hard task dependency for waiting-on-dependency edit intents", () => {
    const draft = buildEmptyTaskPayload(EMPTY_BOOTSTRAP);
    const updatedDraft = applyTaskEditIntentToDraft(draft, { intentState: "waiting-on-dependency" });
    expect(updatedDraft.taskDependencies).toEqual([expect.objectContaining({ dependencyType: "hard", kind: "task", refId: "", requiredState: "complete" })]);
  });
});
