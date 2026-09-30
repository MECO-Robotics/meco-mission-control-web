/// <reference types="jest" />

import { persistedCarryForwardRuleMode, ruleMatchStrategyForMode } from "../model/cadStepMappingRules";

describe("CAD STEP mapping rules", () => {
  it("maps selected carry-forward modes to distinct future rule strategies", () => {
    expect(ruleMatchStrategyForMode("exact")).toBe("STABLE_SIGNATURE");
    expect(ruleMatchStrategyForMode("normalized")).toBe("NORMALIZED_NAME");
    expect(ruleMatchStrategyForMode("manual")).toBe("MANUAL_ONLY");
    expect(ruleMatchStrategyForMode("ignore")).toBe("STABLE_SIGNATURE");
    expect(ruleMatchStrategyForMode("snapshot")).toBeUndefined();
    expect(ruleMatchStrategyForMode("split_merge_deferred")).toBeUndefined();
  });

  it("uses saved mapping rule strategy when describing persisted carry-forward rules", () => {
    const baseMapping = {
      id: "mapping-rule",
      snapshotId: "cad-snapshot-2",
      mappingRuleId: "rule",
      sourceKind: "PART_DEFINITION" as const,
      sourceId: "cad-part",
      sourceName: "Roller tube",
      targetKind: "PART_DEFINITION" as const,
      targetId: "part-roller",
      confidence: "HIGH" as const,
      status: "CONFIRMED" as const,
      updatedAt: "2026-05-10T00:00:00.000Z",
    };

    expect(persistedCarryForwardRuleMode({
      ...baseMapping,
      rule: { id: "rule-normalized", confidence: "HIGH", matchStrategy: "NORMALIZED_NAME" },
    })).toBe("normalized");
    expect(persistedCarryForwardRuleMode({
      ...baseMapping,
      rule: { id: "rule-manual", confidence: "MANUAL", matchStrategy: "MANUAL_ONLY" },
    })).toBe("manual");
  });
});
