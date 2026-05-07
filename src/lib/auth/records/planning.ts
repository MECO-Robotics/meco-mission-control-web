import type { MemberCreatePayload, MemberPayload, ProjectCreatePayload, ProjectPayload, SeasonCreatePayload } from "@/types/payloads";
import type { MemberRecord, ProjectRecord, SeasonRecord } from "@/types/recordsOrganization";
import { requestItem } from "./common";

export function createSeasonRecord(
  payload: SeasonCreatePayload,
  onUnauthorized?: () => void,
) {
  return requestItem<SeasonRecord, SeasonCreatePayload>(
    "/seasons",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function createProjectRecord(
  payload: ProjectCreatePayload,
  onUnauthorized?: () => void,
) {
  return requestItem<ProjectRecord, ProjectCreatePayload>(
    "/projects",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function updateProjectRecord(
  projectId: string,
  payload: Partial<ProjectPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<ProjectRecord, Partial<ProjectPayload>>(
    `/projects/${projectId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function createMemberRecord(
  payload: MemberCreatePayload,
  onUnauthorized?: () => void,
) {
  return requestItem<MemberRecord, MemberCreatePayload>(
    "/members",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function updateMemberRecord(
  memberId: string,
  payload: Partial<MemberPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<MemberRecord, Partial<MemberPayload>>(
    `/members/${memberId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function deleteMemberRecord(memberId: string, onUnauthorized?: () => void) {
  return requestItem<MemberRecord, never>(`/members/${memberId}`, "DELETE", undefined, onUnauthorized);
}
