import {
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Plus } from "lucide-react";

export interface TopbarAddMenuAction {
  icon?: ReactNode;
  label: string;
  onSelect: () => void;
}

interface WorkspaceTopbarAddMenuProps {
  actions: TopbarAddMenuAction[];
  ariaLabel: string;
  title: string;
  tutorialTarget?: string;
}

export function WorkspaceTopbarAddMenu({
  actions,
  ariaLabel,
  title,
  tutorialTarget,
}: WorkspaceTopbarAddMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const hasMenu = actions.length > 1;
  const primaryAction = actions[0];

  useEffect(() => {
    if (!isMenuOpen || !hasMenu) {
      return;
    }

    const dismissOnOutsidePointer = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsMenuOpen(false);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setIsMenuOpen(false);
    };

    document.addEventListener("pointerdown", dismissOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", dismissOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [hasMenu, isMenuOpen]);

  const handleMenuToggle = () => {
    if (!hasMenu) {
      primaryAction.onSelect();
      return;
    }

    setIsMenuOpen((current) => !current);
  };

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Escape") {
      return;
    }

    setIsMenuOpen(false);
    event.currentTarget.blur();
  };

  const handleMenuSelect =
    (onSelect: TopbarAddMenuAction["onSelect"]) => (event: ReactMouseEvent<HTMLButtonElement>) => {
      onSelect();
      setIsMenuOpen(false);
      event.currentTarget.blur();
    };

  if (!primaryAction) {
    return null;
  }

  return (
    <div
      className="topbar-add-menu"
      data-open={isMenuOpen ? "true" : "false"}
      ref={menuRef}
    >
      <button
        aria-expanded={hasMenu ? (isMenuOpen ? "true" : "false") : undefined}
        aria-haspopup={hasMenu ? "menu" : undefined}
        aria-label={ariaLabel}
        className="topbar-add-button topbar-add-menu-trigger secondary-action icon-button"
        data-tutorial-target={tutorialTarget}
        onClick={handleMenuToggle}
        onKeyDown={handleMenuKeyDown}
        title={title}
        type="button"
      >
        <Plus aria-hidden="true" size={14} strokeWidth={2} />
      </button>

      {hasMenu ? (
        <div aria-label={title} className="topbar-add-menu-panel" role="menu">
          {actions.map((action) => (
            <button
              className="topbar-add-menu-item"
              key={action.label}
              onClick={handleMenuSelect(action.onSelect)}
              role="menuitem"
              type="button"
            >
              {action.icon ? <span aria-hidden="true" className="topbar-add-menu-icon">{action.icon}</span> : null}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
