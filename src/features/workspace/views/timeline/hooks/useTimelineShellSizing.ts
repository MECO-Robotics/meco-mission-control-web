import { useEffect, useState } from "react";
import type { MutableRefObject } from "react";

export function useTimelineShellSizing(shellRef: MutableRefObject<HTMLDivElement | null>) {
  const [shellWidth, setShellWidth] = useState(0);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return undefined;

    const updateZoomFloor = () => {
      const width = shell.getBoundingClientRect().width;
      setShellWidth((previous) => (previous === width ? previous : width));
    };

    updateZoomFloor();
    if (typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(updateZoomFloor);
    observer.observe(shell);
    return () => observer.disconnect();
  }, [shellRef]);

  return shellWidth;
}
