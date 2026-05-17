import { UserSearch, Users } from "lucide-react";

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
      aria-label={isActive ? "Switch to Users" : "Switch to User search"}
      aria-pressed={isActive}
      className={isActive ? "app-topbar-my-view-button is-active" : "app-topbar-my-view-button"}
      data-state={isActive ? "user-search" : "users"}
      disabled={!memberName}
      onClick={onToggle}
      title={
        memberName
          ? isActive
            ? `Showing ${memberName}. Switch to all users.`
            : `Showing all users. Switch to ${memberName}.`
          : "No roster member matches the signed-in user"
      }
      type="button"
    >
      <span aria-hidden="true" className="app-topbar-my-view-track">
        <span className="app-topbar-my-view-thumb" />
        <span className="app-topbar-my-view-option app-topbar-my-view-option-users">
          <Users size={14} strokeWidth={2} />
        </span>
        <span className="app-topbar-my-view-option app-topbar-my-view-option-search">
          <UserSearch size={14} strokeWidth={2} />
        </span>
      </span>
    </button>
  );
}
