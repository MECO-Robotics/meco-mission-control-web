import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

import { SearchToolbarInput } from "./workspaceSearchToolbarInput";

export function TopbarResponsiveSearch({
  ariaLabel,
  onChange,
  placeholder,
  value,
}: {
  ariaLabel: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  const [isCompactOpen, setIsCompactOpen] = useState(false);
  const compactRef = useRef<HTMLDivElement>(null);
  const isActive = value.trim() !== "";

  useEffect(() => {
    if (!isCompactOpen || typeof document === "undefined") {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Node && !compactRef.current?.contains(target)) {
        setIsCompactOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCompactOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCompactOpen]);

  return (
    <div className="topbar-responsive-search">
      <div className="topbar-responsive-search-full">
        <SearchToolbarInput
          ariaLabel={ariaLabel}
          onChange={onChange}
          placeholder={placeholder}
          value={value}
        />
      </div>

      <div className={`topbar-responsive-search-compact${isCompactOpen ? " is-open" : ""}`} ref={compactRef}>
        <button
          aria-expanded={isCompactOpen}
          aria-haspopup="dialog"
          aria-label={ariaLabel}
          className={`icon-button app-topbar-icon-button topbar-responsive-search-toggle${isActive ? " is-active" : ""}`}
          onClick={() => setIsCompactOpen((current) => !current)}
          title={ariaLabel}
          type="button"
        >
          <Search size={14} strokeWidth={2} />
        </button>
        {isCompactOpen ? (
          <div className="topbar-responsive-search-popover">
            <input
              aria-label={ariaLabel}
              className="toolbar-search-input"
              onChange={(event) => onChange(event.target.value)}
              placeholder={placeholder}
              type="search"
              value={value}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
