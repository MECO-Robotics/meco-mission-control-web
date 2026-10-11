import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import type { SubsystemLayoutFields } from "@/lib/appUtils/subsystemLayout";
import type { NavigationTarget } from "@/lib/workspaceNavigation";
import { makeAddMenuAction } from "@/features/workspace/shared/topbar";

import { CadFileViewer } from "../cad/viewer/CadPartViewer";
import { RobotConfigurationToolbar } from "./RobotConfigurationToolbar";
import { RobotMapCanvas } from "./RobotMapCanvas";
import { buildAutoArrangedLayouts, buildUnplacedLayout } from "./robotMapLayout";
import { buildRobotConfigurationViewModel } from "./robotMapViewModel";
import { SubsystemDetailPanel } from "./SubsystemDetailPanel";

interface RobotMapViewProps {
  bootstrap: BootstrapPayload;
  handleDeleteMechanism: (mechanismId: string) => Promise<void>;
  openCreateMechanismModal: (subsystemId?: string) => void;
  openCreatePartInstanceModal: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  openCreateSubsystemModal: () => void;
  onOpenCadWorkspace?: () => void;
  openEditMechanismModal: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  openEditPartInstanceModal: (partInstance: BootstrapPayload["partInstances"][number]) => void;
  openEditSubsystemModal: (subsystem: BootstrapPayload["subsystems"][number]) => void;
  onOpenDrilldownTarget?: (target: NavigationTarget) => void;
  removePartInstanceFromMechanism: (partInstanceId: string) => Promise<boolean>;
  onSavePartImage?: (partId: string, revision: string, imageUrl: string) => Promise<void>;
  saveSubsystemLayout: (
    subsystemId: string,
    layout: SubsystemLayoutFields,
  ) => Promise<boolean>;
  updateSubsystemConfiguration: (
    subsystemId: string,
    patch: Partial<
      Pick<
        BootstrapPayload["subsystems"][number],
        "name" | "description" | "layoutX" | "layoutY" | "layoutZone" | "layoutView" | "sortOrder"
      >
    >,
  ) => Promise<boolean>;
}

export function RobotMapView({
  bootstrap,
  handleDeleteMechanism,
  openCreateMechanismModal,
  openCreatePartInstanceModal,
  openCreateSubsystemModal,
  onOpenCadWorkspace,
  openEditMechanismModal,
  openEditPartInstanceModal,
  openEditSubsystemModal,
  onOpenDrilldownTarget,
  removePartInstanceFromMechanism,
  onSavePartImage,
  saveSubsystemLayout,
  updateSubsystemConfiguration,
}: RobotMapViewProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("layout");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedSubsystemId, setSelectedSubsystemId] = useState<string | null>(null);
  const [layoutDraftBySubsystemId, setLayoutDraftBySubsystemId] = useState<
    Record<string, SubsystemLayoutFields>
  >({});
  const [isLayoutEditEnabled, setIsLayoutEditEnabled] = useState(false);
  const layoutPersistVersionBySubsystemIdRef = useRef<Record<string, number>>({});

  const primaryProjectId = bootstrap.projects[0]?.id ?? "default";
  const viewModel = useMemo(() => buildRobotConfigurationViewModel(bootstrap, search), [bootstrap, search]);

  const subsystems = useMemo(
    () =>
      [...viewModel.subsystems].sort((a, b) => {
        const direction = sortDirection === "asc" ? 1 : -1;
        const value = sortField === "name" ? a.name.localeCompare(b.name) : sortField === "mechanisms" ? a.mechanismCount - b.mechanismCount : sortField === "parts" ? a.partCount - b.partCount : (a.layout.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.layout.sortOrder ?? Number.MAX_SAFE_INTEGER);
        return value * direction;
      }).map((subsystem) => ({
        ...subsystem,
        layout: layoutDraftBySubsystemId[subsystem.id] ?? subsystem.layout,
      })),
    [layoutDraftBySubsystemId, sortDirection, sortField, viewModel.subsystems],
  );
  useEffect(() => {
    if (subsystems.length === 0) {
      setSelectedSubsystemId(null);
      return;
    }

    if (!selectedSubsystemId || !subsystems.some((subsystem) => subsystem.id === selectedSubsystemId)) {
      setSelectedSubsystemId(subsystems[0].id);
    }
  }, [selectedSubsystemId, subsystems]);

  const selectedSubsystem = useMemo(
    () =>
      selectedSubsystemId
        ? subsystems.find((subsystem) => subsystem.id === selectedSubsystemId) ?? subsystems[0] ?? null
        : subsystems[0] ?? null,
    [selectedSubsystemId, subsystems],
  );

  const applyLayoutDraft = useCallback((subsystemId: string, layout: SubsystemLayoutFields) => {
    setLayoutDraftBySubsystemId((current) => ({
      ...current,
      [subsystemId]: layout,
    }));
  }, []);
  const toggleLayoutEdit = useCallback(() => {
    setIsLayoutEditEnabled((current) => !current);
  }, []);

  const persistLayouts = async (
    nextLayouts: Record<string, SubsystemLayoutFields>,
  ) => {
    const requestVersionBySubsystemId = Object.fromEntries(
      Object.keys(nextLayouts).map((subsystemId) => {
        const nextVersion = (layoutPersistVersionBySubsystemIdRef.current[subsystemId] ?? 0) + 1;
        layoutPersistVersionBySubsystemIdRef.current[subsystemId] = nextVersion;
        return [subsystemId, nextVersion] as const;
      }),
    );

    const saveResults = await Promise.all(
      Object.entries(nextLayouts).map(async ([subsystemId, layout]) => ({
        subsystemId,
        didPersist: await saveSubsystemLayout(subsystemId, layout).catch(() => false),
        requestVersion: requestVersionBySubsystemId[subsystemId] ?? 0,
      })),
    );

    setLayoutDraftBySubsystemId((current) => {
      const next = { ...current };
      saveResults.forEach(({ subsystemId, requestVersion }) => {
        if (layoutPersistVersionBySubsystemIdRef.current[subsystemId] === requestVersion && current[subsystemId] === nextLayouts[subsystemId]) {
          // The save owner updates bootstrap; completed drafts no longer shadow it.
          delete next[subsystemId];
        }
      });
      return next;
    });
  };

  const handleLayoutDrop = async (subsystemId: string, layout: SubsystemLayoutFields) => {
    applyLayoutDraft(subsystemId, layout);
    await persistLayouts(
      { [subsystemId]: layout },
    );
  };

  const handleAutoArrange = async () => {
    const visibleSubsystemIds = new Set(subsystems.map((subsystem) => subsystem.id));
    const autoLayouts = buildAutoArrangedLayouts(
      bootstrap.subsystems.map((subsystem) => {
        const draftLayout = layoutDraftBySubsystemId[subsystem.id];
        return {
          id: subsystem.id,
          layoutX: draftLayout?.layoutX ?? subsystem.layoutX,
          layoutY: draftLayout?.layoutY ?? subsystem.layoutY,
          layoutView: draftLayout?.layoutView ?? subsystem.layoutView,
          layoutZone: draftLayout?.layoutZone ?? subsystem.layoutZone,
          sortOrder: draftLayout?.sortOrder ?? subsystem.sortOrder,
        };
      }),
      visibleSubsystemIds,
    );
    setLayoutDraftBySubsystemId((current) => ({ ...current, ...autoLayouts }));

    await persistLayouts(autoLayouts);
  };

  const handleResetLayout = async () => {
    const resetLayouts = Object.fromEntries(
      bootstrap.subsystems.map((subsystem, index) => [subsystem.id, buildUnplacedLayout(index)] as const),
    );
    setLayoutDraftBySubsystemId((current) => ({ ...current, ...resetLayouts }));

    await persistLayouts(resetLayouts);
  };

  return (
    <section className={`panel dense-panel robot-config-shell ${WORKSPACE_PANEL_CLASS}`}>
      <RobotConfigurationToolbar
        onSearchChange={setSearch}
        onSortDirectionChange={setSortDirection}
        onSortFieldChange={setSortField}
        search={search}
        sortDirection={sortDirection}
        sortField={sortField}
      />

      <div className={`robot-config-main robot-config-main-map${selectedSubsystem ? "" : " is-empty"}`}>
        <RobotMapCanvas
          cadViewer={(onOrbitingChange) => (
            <CadFileViewer
              embeddedInMap
              importPlacement="topbar"
              key={primaryProjectId}
              additionalTopbarActions={[makeAddMenuAction("Add subsystem", openCreateSubsystemModal)]}
              onOrbitingChange={onOrbitingChange}
              onOpenCadWorkspace={onOpenCadWorkspace}
              partDefinitions={bootstrap.partDefinitions}
              onSavePartImage={onSavePartImage}
            />
          )}
          isLayoutEditEnabled={isLayoutEditEnabled}
          onAutoArrange={handleAutoArrange}
          onDraftLayoutChange={applyLayoutDraft}
          onLayoutDrop={handleLayoutDrop}
          onResetLayout={handleResetLayout}
          onSelectSubsystem={setSelectedSubsystemId}
          onToggleLayoutEdit={toggleLayoutEdit}
          selectedSubsystemId={selectedSubsystemId}
          subsystems={subsystems}
        />

        {selectedSubsystem ? <SubsystemDetailPanel
            onCreateMechanism={openCreateMechanismModal}
            onCreatePartInstance={openCreatePartInstanceModal}
            onDeleteMechanism={handleDeleteMechanism}
            onEditMechanism={openEditMechanismModal}
            onEditPartInstance={openEditPartInstanceModal}
            onEditSubsystem={openEditSubsystemModal}
            onOpenDrilldownTarget={onOpenDrilldownTarget}
            onRemovePartFromMechanism={removePartInstanceFromMechanism}
            onSaveSubsystemConfiguration={updateSubsystemConfiguration}
            selectedSubsystem={selectedSubsystem}
        /> : null}
      </div>
    </section>
  );
}
