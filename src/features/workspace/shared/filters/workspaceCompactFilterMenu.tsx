import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Filter } from "lucide-react";

export type CompactFilterMenuItem = {
  content: ReactNode;
  hidden?: boolean;
  label: string;
};

export function CompactFilterMenu({
  activeCount = 0,
  ariaLabel = "Filters",
  buttonLabel = "Filters",
  className,
  icon,
  iconOnly = false,
  onButtonClick,
  items,
}: {
  activeCount?: number;
  ariaLabel?: string;
  buttonLabel?: string;
  className?: string;
  icon?: ReactNode;
  iconOnly?: boolean;
  onButtonClick?: () => void;
  items: CompactFilterMenuItem[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLSpanElement>(null);
  const menuId = useId();
  const visibleItems = items.filter((item) => !item.hidden);
  const isActive = activeCount > 0;

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") {
      return;
    }

    const handlePointerDown = (milestone: MouseEvent) => {
      const target = milestone.target;
      if (target instanceof Node && !menuRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (milestone: KeyboardEvent) => {
      if (milestone.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <span
      className={`toolbar-filter toolbar-filter-dropdown task-queue-filter-menu${iconOnly ? " is-icon-only" : ""}${isActive ? " is-active" : ""}${isOpen ? " is-open" : ""}${className ? ` ${className}` : ""}`}
      ref={menuRef}
    >
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        className="toolbar-filter-menu-button task-queue-filter-menu-button"
        onClick={() => {
          onButtonClick?.();
          setIsOpen((current) => !current);
        }}
        title={buttonLabel}
        type="button"
      >
        <span className="toolbar-filter-icon">
          {icon ?? <Filter size={14} strokeWidth={2} />}
        </span>
        {iconOnly ? null : (
          <span aria-hidden="true" className="toolbar-filter-value">
            {buttonLabel}
          </span>
        )}
        {activeCount > 0 ? (
          <span aria-hidden="true" className="task-queue-filter-count">
            {activeCount}
          </span>
        ) : null}
        {iconOnly ? null : <span aria-hidden="true" className="toolbar-filter-chevron" />}
      </button>

      {isOpen ? (
        <div aria-label={ariaLabel} className="task-queue-filter-menu-popover" id={menuId} role="menu">
          {visibleItems.map((item) => (
            <div className="task-queue-filter-menu-item" key={item.label}>
              <span className="task-queue-filter-menu-label">{item.label}</span>
              {item.content}
            </div>
          ))}
        </div>
      ) : null}
    </span>
  );
}
