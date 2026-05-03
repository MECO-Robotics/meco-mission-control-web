import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

interface TaskDetailRevealProps {
  className?: string;
  style?: CSSProperties;
  text: string;
}

export function TaskDetailReveal({ className, style, text }: TaskDetailRevealProps) {
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [overlayStyle, setOverlayStyle] = useState<CSSProperties | null>(null);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") {
      return;
    }

    const anchor = anchorRef.current;
    if (!anchor) {
      return;
    }

    const syncOverlay = () => {
      const rect = anchor.getBoundingClientRect();
      const computed = window.getComputedStyle(anchor);

      setOverlayStyle({
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        letterSpacing: computed.letterSpacing,
        lineHeight: computed.lineHeight,
        left: `${Math.max(12, rect.left)}px`,
        position: "fixed",
        top: `${Math.max(12, rect.top)}px`,
        transform: "none",
        textTransform: computed.textTransform,
      });
    };

    syncOverlay();

    const handleDismiss = () => {
      setIsOpen(false);
    };

    window.addEventListener("resize", handleDismiss);
    window.addEventListener("scroll", handleDismiss, true);

    return () => {
      window.removeEventListener("resize", handleDismiss);
      window.removeEventListener("scroll", handleDismiss, true);
    };
  }, [isOpen, text]);

  return (
    <>
      <span
        className={className}
        onPointerEnter={() => setIsOpen(true)}
        onPointerLeave={() => setIsOpen(false)}
        ref={anchorRef}
        style={style}
      >
        {text}
      </span>
      {isOpen && overlayStyle && typeof document !== "undefined"
        ? createPortal(
            <span aria-hidden="true" className="task-detail-ellipsis-reveal-popout" style={overlayStyle}>
              {text}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}
