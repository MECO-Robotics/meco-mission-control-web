import { IconEye, IconRefresh } from "@/components/shared/Icons";

export function AppTopbarMyViewToggle({
  isActive,
  memberName,
  onToggle,
}: {
  isActive: boolean;
  memberName: string | null;
  onToggle: () => void;
}) {
  return (
    <button
      aria-label={isActive ? "Clear My View filter" : "Show My View filter"}
      aria-pressed={isActive}
      className={isActive ? "app-topbar-my-view-button is-active" : "app-topbar-my-view-button"}
      disabled={!memberName}
      onClick={onToggle}
      title={
        memberName
          ? isActive
            ? `Showing ${memberName}`
            : `Filter workspace to ${memberName}`
          : "No roster member matches the signed-in user"
      }
      type="button"
    >
      <IconEye />
    </button>
  );
}

export function AppTopbarRefreshButton({
  isLoadingData,
  loadWorkspace,
}: {
  isLoadingData: boolean;
  loadWorkspace: () => Promise<void>;
}) {
  return (
    <button
      aria-label="Refresh workspace"
      className={
        isLoadingData
          ? "icon-button refresh-button app-topbar-icon-button is-loading"
          : "icon-button refresh-button app-topbar-icon-button"
      }
      onClick={() => void loadWorkspace()}
      title="Refresh workspace"
      type="button"
    >
      <IconRefresh />
    </button>
  );
}
