import type { BootstrapPayload } from "@/types/bootstrap";
import type { ProjectRecord } from "@/types/recordsOrganization";

export function getWorkTypesForProject(bootstrap: BootstrapPayload, project: Pick<ProjectRecord, "id" | "projectType"> | null | undefined) {
  if (!project) return [];
  return bootstrap.workTypes.filter((workType) => workType.projectType === project.projectType && workType.isActive);
}

export function isWorkTypeAllowedForProject(bootstrap: BootstrapPayload, project: Pick<ProjectRecord, "id" | "projectType"> | null | undefined, workTypeId: string) {
  return getWorkTypesForProject(bootstrap, project).some((workType) => workType.id === workTypeId);
}

export function getDefaultWorkTypeIdForProject(bootstrap: BootstrapPayload, project: Pick<ProjectRecord, "id" | "projectType"> | null | undefined) {
  return getWorkTypesForProject(bootstrap, project)[0]?.id ?? "";
}
