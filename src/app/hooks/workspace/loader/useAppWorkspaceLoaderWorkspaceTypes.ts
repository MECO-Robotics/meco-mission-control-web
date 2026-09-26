import type { BootstrapPayload } from "@/types/bootstrap";

export type SelectMemberHandler = (memberId: string | null, payload: BootstrapPayload) => void;
export type UnauthorizedHandler = () => void;
export interface WorkspaceLoadScope {
  personId?: string | null;
  projectId?: string | null;
  seasonId?: string | null;
}
