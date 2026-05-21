import { ArrowDownLeft, ArrowUpRight, Users } from "lucide-react";

import { MECO_PROFILE_AVATAR_SIZE } from "@/lib/branding";
import type { SessionUser } from "@/lib/auth/types";

const LOCAL_DEV_PROFILE_INITIAL = "L";

function getProfileFallbackInitial(sessionUser: SessionUser) {
  if (sessionUser.accountId === "local-dev") {
    return LOCAL_DEV_PROFILE_INITIAL;
  }

  const name = sessionUser.name.trim();
  const email = sessionUser.email.trim();

  return (name || email || LOCAL_DEV_PROFILE_INITIAL).slice(0, 1).toUpperCase();
}

function ProfileAvatar({
  displayName,
  sessionUser,
}: {
  displayName: string;
  sessionUser: SessionUser;
}) {
  if (sessionUser.picture) {
    return (
      <img
        alt={`${displayName} profile`}
        className="profile-avatar"
        height={MECO_PROFILE_AVATAR_SIZE}
        loading="eager"
        referrerPolicy="no-referrer"
        src={sessionUser.picture}
        width={MECO_PROFILE_AVATAR_SIZE}
      />
    );
  }

  return (
    <span className="profile-avatar profile-avatar-fallback" aria-hidden="true">
      {getProfileFallbackInitial(sessionUser)}
    </span>
  );
}

function SignedInProfileAssembly({
  isMyViewActive,
  myViewMemberName,
  onToggleMyView,
  sessionUser,
}: AppProfileAssemblyProps & { sessionUser: SessionUser }) {
  const displayName = myViewMemberName || sessionUser.name || "Local access";
  const activeViewLabel = isMyViewActive ? "Personal view" : "All users view";
  const inactiveViewLabel = isMyViewActive ? "all users" : "personal view";
  const profileAvatar = <ProfileAvatar displayName={displayName} sessionUser={sessionUser} />;
  const usersAvatar = (
    <span className="profile-view-users-icon" aria-hidden="true">
      <Users size={15} strokeWidth={2} />
    </span>
  );
  const selectedViewAvatar = isMyViewActive ? profileAvatar : usersAvatar;
  const alternateViewAvatar = isMyViewActive ? usersAvatar : profileAvatar;
  const SwitchArrowIcon = isMyViewActive ? ArrowDownLeft : ArrowUpRight;
  const handleMyViewClick = () => {
    onToggleMyView();
  };

  return (
    <div className="profile-view-switch sidebar-profile-toggle">
      <button
        aria-label={`${activeViewLabel}. Switch to ${inactiveViewLabel}.`}
        aria-pressed={isMyViewActive}
        className="user-chip profile-trigger profile-trigger-view-switch"
        data-view={isMyViewActive ? "personal" : "all"}
        onClick={handleMyViewClick}
        type="button"
      >
        <span className="profile-view-stack" aria-hidden="true">
          <span className="profile-view-option profile-view-option-other">{alternateViewAvatar}</span>
          <span className="profile-view-option profile-view-option-selected">{selectedViewAvatar}</span>
        </span>
        <span className="profile-trigger-label">Switch view</span>
        <span
          aria-hidden="true"
          className="profile-view-switch-arrow"
          data-direction={isMyViewActive ? "down-left" : "up-right"}
        >
          <SwitchArrowIcon size={12} strokeWidth={2.2} />
        </span>
      </button>
    </div>
  );
}

function LocalProfileAssembly() {
  return (
    <div className="profile-menu">
      <span
        aria-label="Local dev profile"
        className="user-chip profile-trigger app-profile-my-view-button"
        role="img"
      >
        <span className="profile-avatar profile-avatar-fallback app-topbar-local-avatar">
          {LOCAL_DEV_PROFILE_INITIAL}
        </span>
      </span>
    </div>
  );
}

export interface AppProfileAssemblyProps {
  isMyViewActive: boolean;
  myViewMemberName: string | null;
  onToggleMyView: () => void;
  sessionUser: SessionUser | null;
}

export function AppProfileAssembly(props: AppProfileAssemblyProps) {
  if (props.sessionUser) {
    return <SignedInProfileAssembly {...props} sessionUser={props.sessionUser} />;
  }

  return <LocalProfileAssembly />;
}
