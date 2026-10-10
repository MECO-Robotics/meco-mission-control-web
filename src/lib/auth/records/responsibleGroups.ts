import type { ResponsibleGroupRecord } from "@/types/recordsOrganization";
import type { ResponsibleGroupPayload } from "@/types/payloads";
import { requestItem } from "./common";

export function createResponsibleGroup(payload: ResponsibleGroupPayload, onUnauthorized?: () => void) {
  return requestItem<ResponsibleGroupRecord, ResponsibleGroupPayload>("/responsible-groups", "POST", payload, onUnauthorized);
}

export function updateResponsibleGroup(id: string, payload: Partial<ResponsibleGroupPayload>, onUnauthorized?: () => void) {
  return requestItem<ResponsibleGroupRecord, Partial<ResponsibleGroupPayload>>(`/responsible-groups/${id}`, "PATCH", payload, onUnauthorized);
}

export function deleteResponsibleGroup(id: string, onUnauthorized?: () => void) {
  return requestItem<ResponsibleGroupRecord, never>(`/responsible-groups/${id}`, "DELETE", undefined, onUnauthorized);
}
