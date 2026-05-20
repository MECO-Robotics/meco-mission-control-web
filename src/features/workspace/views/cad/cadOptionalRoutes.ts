function hasApiStatus(error: unknown): error is { statusCode: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof (error as { statusCode?: unknown }).statusCode === "number"
  );
}

export function isMissingCadOptionalRoute(error: unknown, routeSuffix: string) {
  return (
    hasApiStatus(error) &&
    error.statusCode === 404 &&
    error instanceof Error &&
    error.message.includes("Route GET:") &&
    error.message.includes(routeSuffix)
  );
}

export function isMissingCadHierarchyReviewRoute(error: unknown) {
  return isMissingCadOptionalRoute(error, "/hierarchy-review");
}
