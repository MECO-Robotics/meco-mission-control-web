import { useEffect, useRef, useState } from "react";

import { RotateCcw } from "lucide-react";

interface RobotMapCanvasActionsProps {
  onResetLayout: () => void;
}

interface RobotMapResetConfirmationProps {
  onConfirm: () => void;
}

export function RobotMapResetConfirmation({ onConfirm }: RobotMapResetConfirmationProps) {
  return (
    <div className="robot-config-reset-menu-panel" role="menu">
      <p>Are you sure?</p>
      <button
        className="primary-action queue-toolbar-action robot-config-reset-confirm"
        onClick={onConfirm}
        type="button"
      >
        Confirm
      </button>
    </div>
  );
}

export function RobotMapCanvasActions({
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
          <RobotMapResetConfirmation
            onConfirm={() => {
              onResetLayout();
              setIsResetMenuOpen(false);
            }}
          />
        ) : null}
      </div>
    </>
  );
}
