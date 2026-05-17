import { useEffect, useRef, useState } from "react";

import { RotateCcw, SquarePlus } from "lucide-react";

interface RobotMapCanvasActionsProps {
  onAddSubsystem: () => void;
  onResetLayout: () => void;
}

export function RobotMapCanvasActions({
  onAddSubsystem,
  onResetLayout,
}: RobotMapCanvasActionsProps) {
  const resetMenuRef = useRef<HTMLDivElement | null>(null);
  const [isResetMenuOpen, setIsResetMenuOpen] = useState(false);

  useEffect(() => {
    if (!isResetMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && resetMenuRef.current?.contains(target)) {
        return;
      }

      setIsResetMenuOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isResetMenuOpen]);

  return (
    <>
      <div className={`robot-config-reset-menu${isResetMenuOpen ? " is-open" : ""}`} ref={resetMenuRef}>
        <button
          aria-expanded={isResetMenuOpen}
          className="secondary-action queue-toolbar-action robot-config-reset-trigger"
          onClick={() => setIsResetMenuOpen((current) => !current)}
          type="button"
        >
          <RotateCcw aria-hidden="true" size={14} />
          <span>Reset</span>
        </button>
        {isResetMenuOpen ? (
          <div className="robot-config-reset-menu-panel" role="menu">
            <p>Are you sure?</p>
            <button
              className="primary-action queue-toolbar-action robot-config-reset-confirm"
              onClick={() => {
                onResetLayout();
                setIsResetMenuOpen(false);
              }}
              type="button"
            >
              Confirm
            </button>
          </div>
        ) : null}
      </div>
      <button
        aria-label="Add subsystem"
        className="icon-button robot-config-unplaced-add-button"
        onClick={onAddSubsystem}
        title="Add subsystem"
        type="button"
      >
        <SquarePlus aria-hidden="true" size={14} />
      </button>
    </>
  );
}
