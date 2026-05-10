import { useEffect, useMemo, useState } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import type { SubsystemLayoutFields } from "@/lib/appUtils/subsystemLayout";

import { RobotConfigurationToolbar } from "./RobotConfigurationToolbar";
import { RobotMapCanvas } from "./RobotMapCanvas";
import { buildAutoArrangedLayouts, buildUnplacedLayout } from "./robotMapLayout";
import { buildRobotConfigurationViewModel } from "./robotMapViewModel";
import { SubsystemDetailPanel } from "./SubsystemDetailPanel";
import { SubsystemMapCard } from "./SubsystemMapCard";

interface RobotMapViewProps {
  bootstrap: BootstrapPayload;
  handleDeleteMechanism: (mechanismId: string) => Promise<void>;
  openCreateMechanismModal: (subsystemId?: string) => void;
  openCreatePartInstanceModal: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  openCreateSubsystemModal: () => void;
  openEditMechanismModal: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  openEditPartInstanceModal: (partInstance: BootstrapPayload["partInstances"][number]) => void;
  openEditSubsystemModal: (subsystem: BootstrapPayload["subsystems"][number]) => void;
  removePartInstanceFromMechanism: (partInstanceId: string) => Promise<boolean>;
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

function buildReferenceImageStorageKey(bootstrap: BootstrapPayload) {
  const primaryProjectId = bootstrap.projects[0]?.id ?? "default";
  return `robot-config-reference-image:${primaryProjectId}`;
}

function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Could not convert selected image."));
    };
    reader.readAsDataURL(file);
  });
}

export function RobotMapView({
  bootstrap,
  handleDeleteMechanism,
  openCreateMechanismModal,
  openCreatePartInstanceModal,
  openCreateSubsystemModal,
  openEditMechanismModal,
  openEditPartInstanceModal,
  openEditSubsystemModal,
  removePartInstanceFromMechanism,
  saveSubsystemLayout,
  updateSubsystemConfiguration,
}: RobotMapViewProps) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedSubsystemId, setSelectedSubsystemId] = useState<string | null>(null);
  const [layoutDraftBySubsystemId, setLayoutDraftBySubsystemId] = useState<
    Record<string, SubsystemLayoutFields>
  >({});
  const [isLayoutEditEnabled, setIsLayoutEditEnabled] = useState(false);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);

  const referenceImageStorageKey = useMemo(() => buildReferenceImageStorageKey(bootstrap), [bootstrap]);
  const viewModel = useMemo(() => buildRobotConfigurationViewModel(bootstrap, search), [bootstrap, search]);

  useEffect(() => {
    const storedImage = window.localStorage.getItem(referenceImageStorageKey);
    setReferenceImageUrl(storedImage);
  }, [referenceImageStorageKey]);

  useEffect(() => {
    setLayoutDraftBySubsystemId((current) => {
      const next: Record<string, SubsystemLayoutFields> = {};
      viewModel.subsystems.forEach((subsystem) => {
        next[subsystem.id] = current[subsystem.id] ?? subsystem.layout;
      });
      return next;
    });
  }, [viewModel.subsystems]);

  const subsystems = useMemo(
    () =>
      viewModel.subsystems.map((subsystem) => ({
        ...subsystem,
        layout: layoutDraftBySubsystemId[subsystem.id] ?? subsystem.layout,
      })),
    [layoutDraftBySubsystemId, viewModel.subsystems],
  );
  const persistedLayoutBySubsystemId = useMemo(() => {
    const nextLayouts: Record<string, SubsystemLayoutFields> = {};
    viewModel.subsystems.forEach((subsystem) => {
      nextLayouts[subsystem.id] = { ...subsystem.layout };
    });
    return nextLayouts;
  }, [viewModel.subsystems]);

  useEffect(() => {
    if (subsystems.length === 0) {
      setSelectedSubsystemId(null);
      return;
    }

    if (!selectedSubsystemId || !subsystems.some((subsystem) => subsystem.id === selectedSubsystemId)) {
      setSelectedSubsystemId(subsystems[0].id);
    }
  }, [selectedSubsystemId, subsystems]);

  const selectedSubsystem =
    selectedSubsystemId ? subsystems.find((subsystem) => subsystem.id === selectedSubsystemId) ?? null : null;

  const applyLayoutDraft = (subsystemId: string, layout: SubsystemLayoutFields) => {
    setLayoutDraftBySubsystemId((current) => ({
      ...current,
      [subsystemId]: layout,
    }));
  };

  const buildRollbackLayouts = (subsystemIds: string[]) => {
    const rollbackLayouts: Record<string, SubsystemLayoutFields> = {};
    subsystemIds.forEach((subsystemId) => {
      rollbackLayouts[subsystemId] = persistedLayoutBySubsystemId[subsystemId]
        ? { ...persistedLayoutBySubsystemId[subsystemId] }
        : buildUnplacedLayout(null);
    });
    return rollbackLayouts;
  };

  const persistLayouts = async (
    nextLayouts: Record<string, SubsystemLayoutFields>,
    rollbackLayoutsBySubsystemId: Record<string, SubsystemLayoutFields>,
  ) => {
    const saveResults = await Promise.all(
      Object.entries(nextLayouts).map(async ([subsystemId, layout]) => ({
        subsystemId,
        didPersist: await saveSubsystemLayout(subsystemId, layout).catch(() => false),
      })),
    );

    const failedRollbackLayouts: Record<string, SubsystemLayoutFields> = {};
    saveResults.forEach(({ subsystemId, didPersist }) => {
      if (!didPersist) {
        failedRollbackLayouts[subsystemId] = rollbackLayoutsBySubsystemId[subsystemId] ?? buildUnplacedLayout(null);
      }
    });

    if (Object.keys(failedRollbackLayouts).length > 0) {
      setLayoutDraftBySubsystemId((current) => ({ ...current, ...failedRollbackLayouts }));
    }
  };

  const handleLayoutDrop = async (subsystemId: string, layout: SubsystemLayoutFields) => {
    applyLayoutDraft(subsystemId, layout);
    await persistLayouts(
      { [subsystemId]: layout },
      buildRollbackLayouts([subsystemId]),
    );
  };

  const handleAutoArrange = async () => {
    const autoLayouts = buildAutoArrangedLayouts(
      subsystems.map((subsystem) => ({
        id: subsystem.id,
        layoutView: subsystem.layout.layoutView,
        layoutZone: subsystem.layout.layoutZone,
      })),
    );
    setLayoutDraftBySubsystemId((current) => ({ ...current, ...autoLayouts }));

    await persistLayouts(autoLayouts, buildRollbackLayouts(Object.keys(autoLayouts)));
  };

  const handleResetLayout = async () => {
    const resetLayouts = Object.fromEntries(
      subsystems.map((subsystem, index) => [subsystem.id, buildUnplacedLayout(index)] as const),
    );
    setLayoutDraftBySubsystemId((current) => ({ ...current, ...resetLayouts }));

    await persistLayouts(resetLayouts, buildRollbackLayouts(Object.keys(resetLayouts)));
  };

  const handleReferenceImageSelected = async (file: File) => {
    const nextImage = await readImageAsDataUrl(file);
    setReferenceImageUrl(nextImage);
    window.localStorage.setItem(referenceImageStorageKey, nextImage);
  };

  return (
    <section className={`panel dense-panel robot-config-shell ${WORKSPACE_PANEL_CLASS}`}>
      <RobotConfigurationToolbar
        onSearchChange={setSearch}
        onViewModeChange={setViewMode}
        search={search}
        viewMode={viewMode}
      />

      {subsystems.length === 0 ? (
        <div className="empty-state robot-config-empty">
          <strong>No subsystems yet.</strong>
          <p className="section-copy">Create your first subsystem to start configuring robot structure and placement.</p>
          <button className="primary-action" onClick={openCreateSubsystemModal} type="button">
            Add subsystem
          </button>
        </div>
      ) : (
        <div className={`robot-config-main robot-config-main-${viewMode}`}>
          <div className="robot-config-center">
            {viewMode === "map" ? (
              <RobotMapCanvas
                isLayoutEditEnabled={isLayoutEditEnabled}
                onAddSubsystem={openCreateSubsystemModal}
                onAutoArrange={handleAutoArrange}
                onDraftLayoutChange={applyLayoutDraft}
                onLayoutDrop={handleLayoutDrop}
                onReferenceImageSelected={(file) => void handleReferenceImageSelected(file)}
                onResetLayout={handleResetLayout}
                onSelectSubsystem={setSelectedSubsystemId}
                onToggleLayoutEdit={() => setIsLayoutEditEnabled((current) => !current)}
                referenceImageUrl={referenceImageUrl}
                selectedSubsystemId={selectedSubsystemId}
                subsystems={subsystems}
              />
            ) : (
              <div className="robot-config-list-view">
                {subsystems.map((subsystem) => (
                  <SubsystemMapCard
                    key={subsystem.id}
                    isSelected={selectedSubsystemId === subsystem.id}
                    onSelect={() => setSelectedSubsystemId(subsystem.id)}
                    subsystem={subsystem}
                  />
                ))}
              </div>
            )}
          </div>

          <SubsystemDetailPanel
            onCreateMechanism={openCreateMechanismModal}
            onCreatePartInstance={openCreatePartInstanceModal}
            onDeleteMechanism={handleDeleteMechanism}
            onEditMechanism={openEditMechanismModal}
            onEditPartInstance={openEditPartInstanceModal}
            onEditSubsystem={openEditSubsystemModal}
            onRemovePartFromMechanism={removePartInstanceFromMechanism}
            onSaveSubsystemConfiguration={updateSubsystemConfiguration}
            selectedSubsystem={selectedSubsystem}
          />
        </div>
      )}
    </section>
  );
}
