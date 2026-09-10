import { useEffect, useRef, useState } from "react";

export function useCompactSearchPopover() {
  const [isCompactOpen, setIsCompactOpen] = useState(false);
  const compactRef = useRef<HTMLDivElement>(null);

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

  return { compactRef, isCompactOpen, setIsCompactOpen };
}
