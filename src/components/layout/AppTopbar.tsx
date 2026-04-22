import { IconPerson, IconRefresh } from "../shared/Icons";
import type { SessionUser } from "../../lib/auth";
import type { BootstrapPayload } from "../../types";

interface AppTopbarProps {
  activePersonFilter: string;
  bootstrap: BootstrapPayload;
  handleSignOut: () => void;
  isLoadingData: boolean;
  loadWorkspace: () => Promise<void>;
  sessionUser: SessionUser | null;
  setActivePersonFilter: (value: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export function AppTopbar({
  activePersonFilter,
  bootstrap,
  handleSignOut,
  isLoadingData,
  loadWorkspace,
  sessionUser,
  setActivePersonFilter,
  isDarkMode,
  toggleDarkMode,
}: AppTopbarProps) {
  return (
    <header
      className="topbar app-topbar"
      style={{
        width: "100%",
        height: "64px",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1000,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        background: "var(--bg-panel)",
        borderBottom: "1px solid var(--border-base)",
      }}
    >
      <div className="app-topbar-title" style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
        <p className="eyebrow" style={{ fontSize: "0.65rem", margin: 0, color: "var(--meco-blue)" }}>
          MECO PM
        </p>
        <h1 style={{ fontSize: "1.1rem", margin: 0, color: "var(--text-title)" }}>
          Project workspace
        </h1>
      </div>
      <div className="topbar-right app-topbar-right">
        <label
          aria-label="Filter person"
          className="toolbar-filter toolbar-filter-compact"
          style={activePersonFilter !== "all" ? { background: "var(--meco-soft-blue)", borderColor: "var(--meco-blue)" } : { background: "var(--bg-row-alt)", border: "1px solid var(--border-base)" }}
        >
          <span aria-hidden="true" className="toolbar-filter-icon" style={activePersonFilter !== "all" ? { color: "var(--meco-blue)" } : {}}>
            <IconPerson />
          </span>
          <select
            onChange={(event) => setActivePersonFilter(event.target.value)}
            value={activePersonFilter}
            style={{
              color: activePersonFilter !== "all" ? "var(--text-title)" : "var(--text-copy)",
              fontWeight: activePersonFilter !== "all" ? "600" : "400",
              background: "inherit",
              colorScheme: isDarkMode ? "dark" : "light",
            }}
          >
            <option value="all">All roster</option>
            {bootstrap.members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
        {sessionUser ? (
          <div className="profile-menu">
            <button
              aria-haspopup="menu"
              className="user-chip profile-trigger"
              type="button"
              style={{ padding: 0, height: "34px" }}
              title={sessionUser.name}
            >
              {sessionUser.picture ? (
                <img
                  alt={`${sessionUser.name} profile`}
                  className="profile-avatar"
                  referrerPolicy="no-referrer"
                  src={sessionUser.picture}
                />
              ) : (
                <span className="profile-avatar profile-avatar-fallback" aria-hidden="true">
                  {sessionUser.name.slice(0, 1).toUpperCase()}
                </span>
              )}
            </button>
            <div aria-label="Profile menu" className="profile-menu-popover" role="menu">
              <button
                className="profile-menu-item"
                onClick={handleSignOut}
                role="menuitem"
                type="button"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <div className="user-chip" style={{ padding: "4px 12px", height: "34px" }}>
            <strong style={{ fontSize: "0.85rem", color: "var(--text-title)" }}>Local access</strong>
          </div>
        )}
        <button
          onClick={toggleDarkMode}
          title="Toggle dark mode"
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-panel)",
            border: "1px solid var(--border-base)",
            borderRadius: "8px",
            width: "34px",
            height: "34px",
            color: isDarkMode ? "#fbbf24" : "#64748b",
            cursor: "pointer",
            padding: 0,
            marginLeft: "8px",
          }}
        >
          {isDarkMode ? "☀️" : "🌙"}
        </button>
        <button
          aria-label="Refresh workspace"
          className={isLoadingData ? "icon-button refresh-button is-loading" : "icon-button refresh-button"}
          onClick={() => void loadWorkspace()}
          title="Refresh workspace"
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--meco-soft-blue)",
            border: "1px solid var(--meco-blue)",
            borderRadius: "8px",
            width: "34px",
            height: "34px",
            color: "var(--meco-blue)",
            cursor: "pointer",
            padding: 0,
            marginLeft: "8px",
          }}
        >
          <IconRefresh />
        </button>
      </div>
    </header>
  );
}
