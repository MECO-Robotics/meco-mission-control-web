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
  onOpenProfileEditor,
  sessionUser,
}: AppProfileAssemblyProps & { sessionUser: SessionUser }) {
  const displayName = sessionUser.name || "Local access";

  return (
    <div className="profile-menu">
      <button
        aria-label="Edit profile"
        className="user-chip profile-trigger app-profile-editor-button"
        onClick={onOpenProfileEditor}
        type="button"
      >
        <ProfileAvatar displayName={displayName} sessionUser={sessionUser} />
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
  onOpenProfileEditor: () => void;
  sessionUser: SessionUser | null;
}

export function AppProfileAssembly(props: AppProfileAssemblyProps) {
  if (props.sessionUser) {
    return <SignedInProfileAssembly {...props} sessionUser={props.sessionUser} />;
  }

  return <LocalProfileAssembly />;
}
