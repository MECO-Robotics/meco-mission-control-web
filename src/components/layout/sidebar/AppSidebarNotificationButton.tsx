import { useEffect, useRef } from "react";
import { Bell } from "lucide-react";

interface AppSidebarNotificationButtonProps {
  isOpen: boolean;
  notificationCount: number;
  onToggle: () => void;
}

export function AppSidebarNotificationButton({
  isOpen,
  notificationCount,
  onToggle,
}: AppSidebarNotificationButtonProps) {
  const notificationLabel =
    notificationCount > 0 ? `Notifications (${notificationCount})` : "Notifications";
  const hoverOpenedNotificationQueueRef = useRef(false);
  const pendingHoverCloseRef = useRef(false);

  useEffect(() => {
    if (pendingHoverCloseRef.current && isOpen) {
      pendingHoverCloseRef.current = false;
      onToggle();
      return;
    }

    if (!isOpen) {
      hoverOpenedNotificationQueueRef.current = false;
      pendingHoverCloseRef.current = false;
    }
  }, [isOpen, onToggle]);

  const handleNotificationQueuePreviewOpen = () => {
    pendingHoverCloseRef.current = false;

    if (!isOpen) {
      hoverOpenedNotificationQueueRef.current = true;
      onToggle();
    }
  };
  const handleNotificationQueuePreviewClose = () => {
    if (!hoverOpenedNotificationQueueRef.current) {
      return;
    }

    hoverOpenedNotificationQueueRef.current = false;
    if (isOpen) {
      pendingHoverCloseRef.current = false;
      onToggle();
      return;
    }

    pendingHoverCloseRef.current = true;
  };
  const handleNotificationQueueFocus = () => {
    if (hoverOpenedNotificationQueueRef.current || isOpen) {
      return;
    }

    onToggle();
  };
  const handleNotificationQueueClick = () => {
    if (hoverOpenedNotificationQueueRef.current) {
      hoverOpenedNotificationQueueRef.current = false;
      pendingHoverCloseRef.current = false;
      return;
    }

    hoverOpenedNotificationQueueRef.current = false;
    pendingHoverCloseRef.current = false;
    onToggle();
  };

  return (
    <button
      aria-expanded={isOpen ? "true" : "false"}
      aria-label={notificationLabel}
      className="sidebar-quick-action sidebar-footer-action-notifications"
      data-active={isOpen ? "true" : "false"}
      onBlur={handleNotificationQueuePreviewClose}
      onClick={handleNotificationQueueClick}
      onFocus={handleNotificationQueueFocus}
      onMouseEnter={handleNotificationQueuePreviewOpen}
      onMouseLeave={handleNotificationQueuePreviewClose}
      title={notificationLabel}
      type="button"
    >
      <Bell aria-hidden="true" size={14} strokeWidth={2} />
      {notificationCount > 0 ? (
        <span className="sidebar-quick-action-badge">{notificationCount}</span>
      ) : null}
    </button>
  );
}
