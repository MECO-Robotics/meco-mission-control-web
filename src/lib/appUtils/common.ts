import type { BootstrapPayload } from "@/types/bootstrap";
import { normalizeEmail, uniqueIds } from "./internal";

export function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong while checking your session.";
}

export function getDefaultSubsystemId(bootstrap: BootstrapPayload) {
  return (
    bootstrap.subsystems.find((subsystem) => subsystem.isCore && !subsystem.isArchived)?.id ??
    bootstrap.subsystems.find((subsystem) => !subsystem.isArchived)?.id ??
    bootstrap.subsystems.find((subsystem) => subsystem.isCore)?.id ??
    bootstrap.subsystems[0]?.id ??
    ""
  );
}

export function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatCurrency(value: number | undefined) {
  if (typeof value !== "number") return "Pending";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function dateDiffInDays(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

export function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function joinList(values: string[]) {
  return values.join(", ");
}

export function findMemberForSessionUser(
  members: BootstrapPayload["members"],
  sessionUser: { email: string } | null | undefined,
) {
  const sessionEmail = normalizeEmail(sessionUser?.email);
  if (!sessionEmail) {
    return null;
  }

  return members.find((member) => normalizeEmail(member.email) === sessionEmail) ?? null;
}

export function getMemberActiveSeasonIds(
  member: Pick<BootstrapPayload["members"][number], "seasonId" | "activeSeasonIds">,
) {
  const seasonIds = uniqueIds([...(member.activeSeasonIds ?? []), member.seasonId]);
  return seasonIds.length > 0 ? seasonIds : [member.seasonId];
}

export function isMemberActiveInSeason(
  member: Pick<BootstrapPayload["members"][number], "seasonId" | "activeSeasonIds">,
  seasonId: string,
) {
  return getMemberActiveSeasonIds(member).includes(seasonId);
}

export function getPartDefinitionActiveSeasonIds(
  partDefinition: Pick<BootstrapPayload["partDefinitions"][number], "seasonId" | "activeSeasonIds">,
) {
  const seasonIds = uniqueIds([...(partDefinition.activeSeasonIds ?? []), partDefinition.seasonId]);
  return seasonIds.length > 0 ? seasonIds : [partDefinition.seasonId];
}

export function isPartDefinitionActiveInSeason(
  partDefinition: Pick<BootstrapPayload["partDefinitions"][number], "seasonId" | "activeSeasonIds">,
  seasonId: string,
) {
  return getPartDefinitionActiveSeasonIds(partDefinition).includes(seasonId);
}

export function normalizeIteration(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value >= 1 ? Math.trunc(value) : 1;
}

export function formatIterationVersion(value: number | null | undefined) {
  return `v${normalizeIteration(value)}`;
}

export function buildIterationOptions(
  iterations: Array<number | null | undefined>,
  selectedIteration: number | null | undefined,
) {
  const highestIteration = Math.max(
    normalizeIteration(selectedIteration),
    ...iterations.map(normalizeIteration),
  );
  const optionCount = Math.max(5, highestIteration + 1);

  return Array.from({ length: optionCount }, (_, index) => index + 1);
}
