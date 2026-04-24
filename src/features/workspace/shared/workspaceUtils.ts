type StatusGroup = "success" | "info" | "warning" | "danger" | "neutral";

const STATUS_GROUPS: Record<Exclude<StatusGroup, "neutral">, Set<string>> = {
  success: new Set(["complete", "delivered", "available", "installed", "low"]),
  info: new Set(["in-progress", "shipped", "purchased", "approved"]),
  warning: new Set(["waiting-for-qa", "qa", "requested", "high", "waiting", "needed"]),
  danger: new Set(["not-started", "critical", "retired"]),
};

export function getStatusPillClassName(value: string): string {
  let group: StatusGroup = "neutral";

  for (const [candidateGroup, values] of Object.entries(STATUS_GROUPS) as Array<[
    Exclude<StatusGroup, "neutral">,
    Set<string>,
  ]>) {
    if (values.has(value)) {
      group = candidateGroup;
      break;
    }
  }

  return `pill status-pill status-pill-${group}`;
}
