import {
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { Boxes, FileText, Flag, ListTodo, Plus } from "lucide-react";

interface AppSidebarAddMenuProps {
  onCreateMilestone: () => void;
  onCreatePart: () => void;
  onCreateQaReport: () => void;
  onCreateTask: () => void;
}

interface AddAction {
  icon: ReactNode;
  label: string;
  onSelect: () => void;
}

export function AppSidebarAddMenu({
  onCreateMilestone,
  onCreatePart,
  onCreateQaReport,
  onCreateTask,
}: AppSidebarAddMenuProps) {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const hoverOpenedAddMenuRef = useRef(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const addActions: AddAction[] = [
    {
      icon: <ListTodo size={14} strokeWidth={2} />,
      label: "Add task",
      onSelect: onCreateTask,
    },
    {
      icon: <FileText size={14} strokeWidth={2} />,
      label: "Add report",
      onSelect: onCreateQaReport,
    },
    {
      icon: <Flag size={14} strokeWidth={2} />,
      label: "Add milestone",
      onSelect: onCreateMilestone,
    },
    {
      icon: <Boxes size={14} strokeWidth={2} />,
      label: "Add part",
      onSelect: onCreatePart,
    },
  ];

  useEffect(() => {
    if (!isAddMenuOpen || !hoverOpenedAddMenuRef.current) {
      return;
    }

    const sidebar = menuRef.current?.closest(".sidebar");
    if (!sidebar) {
      return;
    }

    const closeHoverMenu = () => {
      if (!hoverOpenedAddMenuRef.current) {
        return;
      }

      hoverOpenedAddMenuRef.current = false;
      setIsAddMenuOpen(false);
    };

    sidebar.addEventListener("mouseleave", closeHoverMenu);
    return () => {
      sidebar.removeEventListener("mouseleave", closeHoverMenu);
    };
  }, [isAddMenuOpen]);

  useEffect(() => {
    if (!isAddMenuOpen) {
      return;
    }

    const dismissOnOutsidePointer = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }

      hoverOpenedAddMenuRef.current = false;
      setIsAddMenuOpen(false);
    };

    document.addEventListener("pointerdown", dismissOnOutsidePointer);
    return () => {
      document.removeEventListener("pointerdown", dismissOnOutsidePointer);
    };
  }, [isAddMenuOpen]);

  const closeAddMenu = () => {
    hoverOpenedAddMenuRef.current = false;
    setIsAddMenuOpen(false);
  };
  const handleAddHover = () => {
    if (isAddMenuOpen) {
      return;
    }

    hoverOpenedAddMenuRef.current = true;
    setIsAddMenuOpen(true);
  };
  const handleAddClick = () => {
    if (hoverOpenedAddMenuRef.current) {
      hoverOpenedAddMenuRef.current = false;
      setIsAddMenuOpen(true);
      return;
    }

    setIsAddMenuOpen((current) => !current);
  };
  const handleAddKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Escape") {
      return;
    }

    event.currentTarget.blur();
    closeAddMenu();
  };
  const handleAddActionSelect =
    (onSelect: () => void) => (event: ReactMouseEvent<HTMLButtonElement>) => {
      onSelect();
      event.currentTarget.blur();
      closeAddMenu();
    };

  return (
    <div
      className="sidebar-add-menu"
      data-open={isAddMenuOpen ? "true" : "false"}
      onMouseEnter={handleAddHover}
      ref={menuRef}
    >
      <button
        aria-expanded={isAddMenuOpen ? "true" : "false"}
        aria-haspopup="menu"
        aria-label="Add new"
        className="sidebar-quick-action sidebar-quick-action-add"
        onClick={handleAddClick}
        onKeyDown={handleAddKeyDown}
        title="Add"
        type="button"
      >
        <Plus aria-hidden="true" size={14} strokeWidth={2} />
      </button>
      <div aria-label="Add menu" className="sidebar-add-menu-panel" role="menu">
        {addActions.map((action) => (
          <button
            className="sidebar-add-menu-item"
            key={action.label}
            onClick={handleAddActionSelect(action.onSelect)}
            role="menuitem"
            type="button"
          >
            <span aria-hidden="true" className="sidebar-add-menu-icon">
              {action.icon}
            </span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
