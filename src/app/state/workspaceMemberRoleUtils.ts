import type { MemberPayload } from "@/types/payloads";

export function isElevatedMemberRole(role: MemberPayload["role"]): boolean {
  return role === "lead" || role === "admin";
}

export function getSinglePersonFilterId(selection: readonly string[]) {
  return selection.length === 1 ? selection[0] : null;
}
