import { useLayoutEffect, useRef, useState } from "react";

export function useCompactSearchPopover(available = true) {
  const [isCompactOpen, setIsCompactOpen] = useState(false);
  const compactRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!available) {
      if (isCompactOpen) setIsCompactOpen(false);
      return;
    }
    if (!isCompactOpen || typeof document === "undefined") {
      return;
    }

    const positionPopover = () => {
      const anchor = compactRef.current;
      const popover = anchor?.querySelector<HTMLElement>(".topbar-responsive-search-popover");
      if (!anchor || !popover) return;
      const bounds = anchor.getBoundingClientRect();
      const width = popover.getBoundingClientRect().width;
      const left = Math.max(8, Math.min(bounds.right - width, window.innerWidth - width - 8));
      popover.style.left = `${left - bounds.left}px`;
      popover.style.right = "auto";
    };
    positionPopover();
    window.addEventListener("resize", positionPopover);
    window.addEventListener("scroll", positionPopover, true);

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Node && !compactRef.current?.contains(target)) {
        setIsCompactOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCompactOpen(false);
        compactRef.current?.querySelector<HTMLButtonElement>(".topbar-responsive-search-toggle")?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", positionPopover);
      window.removeEventListener("scroll", positionPopover, true);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [available, isCompactOpen]);

  return { compactRef, isCompactOpen: available && isCompactOpen, setIsCompactOpen };
}
