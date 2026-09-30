export function normalizeTaskTargetIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];

  return Array.from(new Set(ids.filter((id): id is string => typeof id === "string" && id.length > 0)));
}
