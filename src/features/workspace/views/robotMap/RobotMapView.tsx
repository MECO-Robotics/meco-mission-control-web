import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import type { SubsystemLayoutFields } from "@/lib/appUtils/subsystemLayout";
import type { NavigationTarget } from "@/lib/workspaceNavigation";

import { CadFileViewer } from "../cad/viewer/CadPartViewer";
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

const REFERENCE_IMAGE_STORAGE_ERROR_MESSAGE =
  "Image loaded for this session, but local browser storage is unavailable.";

function buildReferenceImageStorageKey(primaryProjectId: string) {
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
  onOpenDrilldownTarget,
  removePartInstanceFromMechanism,
  onSavePartImage,
  saveSubsystemLayout,
  updateSubsystemConfiguration,
}: RobotMapViewProps) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"map" | "list" | "3d">("map");
  const [selectedSubsystemId, setSelectedSubsystemId] = useState<string | null>(null);
  const [layoutDraftBySubsystemId, setLayoutDraftBySubsystemId] = useState<
    Record<string, SubsystemLayoutFields>
  >({});
  const [isLayoutEditEnabled, setIsLayoutEditEnabled] = useState(false);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [referenceImageStorageNotice, setReferenceImageStorageNotice] = useState<string | null>(null);
  const layoutPersistVersionBySubsystemIdRef = useRef<Record<string, number>>({});

  const primaryProjectId = bootstrap.projects[0]?.id ?? "default";
  const referenceImageStorageKey = useMemo(
    () => buildReferenceImageStorageKey(primaryProjectId),
    [primaryProjectId],
  );
  const viewModel = useMemo(() => buildRobotConfigurationViewModel(bootstrap, search), [bootstrap, search]);

  useEffect(() => {
    try {
      const storedImage = window.localStorage.getItem(referenceImageStorageKey);
      setReferenceImageUrl(storedImage);
      setReferenceImageStorageNotice(null);
    } catch (error) {
      setReferenceImageUrl(null);
      setReferenceImageStorageNotice(REFERENCE_IMAGE_STORAGE_ERROR_MESSAGE);
      console.warn("Failed to read robot reference image from local storage.", error);
    }
  }, [referenceImageStorageKey]);

  const subsystems = useMemo(
    () =>
      viewModel.subsystems.map((subsystem) => ({
        ...subsystem,
        layout: layoutDraftBySubsystemId[subsystem.id] ?? subsystem.layout,
      })),
    [layoutDraftBySubsystemId, viewModel.subsystems],
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

  const handleReferenceImageSelected = async (file: File) => {
    const nextImage = await readImageAsDataUrl(file);
    setReferenceImageUrl(nextImage);
    try {
      window.localStorage.setItem(referenceImageStorageKey, nextImage);
      setReferenceImageStorageNotice(null);
    } catch (error) {
      setReferenceImageStorageNotice(REFERENCE_IMAGE_STORAGE_ERROR_MESSAGE);
      console.warn("Failed to persist robot reference image locally.", error);
    }
  };

  return (
    <section className={`panel dense-panel robot-config-shell ${WORKSPACE_PANEL_CLASS}`}>
      <RobotConfigurationToolbar
        onSearchChange={setSearch}
        onViewModeChange={setViewMode}
        search={search}
        viewMode={viewMode}
      />

      {viewMode === "3d" ? (
        <CadFileViewer
          key={primaryProjectId}
          title="Robot parts"
          partDefinitions={bootstrap.partDefinitions}
          onSavePartImage={onSavePartImage}
          description="Choose a STEP assembly to inspect the robot in 3D. Select a CAD part to save its still image to a matching part record."
        />
      ) : subsystems.length === 0 ? (
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
                onToggleLayoutEdit={toggleLayoutEdit}
                referenceImageUrl={referenceImageUrl}
                referenceImageStorageNotice={referenceImageStorageNotice}
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
            onOpenDrilldownTarget={onOpenDrilldownTarget}
            onRemovePartFromMechanism={removePartInstanceFromMechanism}
            onSaveSubsystemConfiguration={updateSubsystemConfiguration}
            selectedSubsystem={selectedSubsystem}
          />
        </div>
      )}
    </section>
  );
}
