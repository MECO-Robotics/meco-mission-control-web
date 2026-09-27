export function indexRecordsById<T extends { id: string }>(items: readonly T[]) {
  return Object.fromEntries(items.map((item) => [item.id, item] as const)) as Record<string, T>;
}
