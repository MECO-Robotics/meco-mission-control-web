import type { AppWorkspaceDerived } from "@/app/hooks/useAppWorkspaceDerived";
import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
import type { BootstrapPayload } from "@/types";

export type AppWorkspaceLoaderModel = AppWorkspaceState & AppWorkspaceDerived;
export type SelectMemberHandler = (memberId: string | null, payload: BootstrapPayload) => void;
export type UnauthorizedHandler = () => void;
