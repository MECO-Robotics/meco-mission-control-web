import { type CSSProperties, type ReactNode } from "react";

type SwipeDirection = "left" | "right" | null;
type TabSwitchDirection = "up" | "down";

export function WorkspaceSectionPanel({
  children,
  disableAnimations = false,
  isActive,
  tabSwitchDirection,
}: {
  children: ReactNode;
  disableAnimations?: boolean;
  isActive: boolean;
  tabSwitchDirection: TabSwitchDirection;
}) {
  if (!isActive) {
    return null;
  }

  const animationClass = !disableAnimations
    ? ` workspace-tab-panel-enter workspace-tab-panel-enter-${tabSwitchDirection}`
    : "";

  return <div className={`workspace-tab-panel${animationClass}`}>{children}</div>;
}

export function WorkspaceSubPanel({
  children,
  description,
  disableAnimations = false,
  isActive,
  pinInteractionNoteToBottom = true,
  swipeDirection = null,
}: {
  children: ReactNode;
  description: string;
  disableAnimations?: boolean;
  isActive: boolean;
  pinInteractionNoteToBottom?: boolean;
  swipeDirection?: SwipeDirection;
}) {
  if (!isActive) {
    return null;
  }

  const panelAnimation = !disableAnimations ? swipeDirection ?? "neutral" : undefined;

  return (
    <div
      className="workspace-tab-panel workspace-subtab-panel"
      data-swipe-direction={panelAnimation}
      style={
        !pinInteractionNoteToBottom
          ? ({
              minHeight: "auto",
            } as CSSProperties)
          : undefined
      }
    >
      {children}
      <div
        className="tab-interaction-note"
        role="note"
        style={
          !pinInteractionNoteToBottom
            ? ({
                marginTop: 0,
              } as CSSProperties)
            : undefined
        }
      >
        <span className="tab-interaction-note-label">How to use this view</span>
        <p>{description}</p>
      </div>
    </div>
  );
}
