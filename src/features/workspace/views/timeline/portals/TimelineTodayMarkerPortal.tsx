import { createPortal } from "react-dom";

interface TimelineTodayMarkerPortalProps {
  portalTarget: HTMLElement | null;
  todayMarkerLeft: number | null;
  showLabelAtTop?: boolean;
}

export const TimelineTodayMarkerPortal: React.FC<TimelineTodayMarkerPortalProps> = ({
  portalTarget,
  todayMarkerLeft,
  showLabelAtTop = false,
}) => {
  if (!portalTarget || todayMarkerLeft === null) {
    return null;
  }

  return createPortal(
    <div
      aria-hidden="true"
      className="timeline-today-marker-column"
      style={{
        left: `${todayMarkerLeft}px`,
        position: "absolute",
        top: 0,
        bottom: 0,
        width: 0,
        pointerEvents: "none",
        zIndex: 10078,
      }}
    >
      <div
        aria-hidden="true"
        className="timeline-today-marker-line"
        style={{
          position: "absolute",
          top: "64px",
          bottom: "20px",
          left: 0,
          width: "2px",
          transform: "translateX(-50%)",
          background: "color-mix(in srgb, var(--meco-blue) 78%, transparent)",
          boxShadow: "0 0 0 1px color-mix(in srgb, var(--meco-blue) 22%, transparent)",
        }}
      />
      <div
        aria-hidden="true"
        className="timeline-today-marker-label"
        style={{
          position: "absolute",
          left: 0,
          top: showLabelAtTop ? "52px" : undefined,
          bottom: showLabelAtTop ? undefined : "2px",
          transform: "translateX(-50%)",
          padding: "1px 6px",
          borderRadius: "999px",
          border: "1px solid var(--border-base)",
          background: "color-mix(in srgb, var(--bg-panel) 88%, transparent)",
          color: "var(--meco-blue)",
          fontSize: "0.6rem",
          fontWeight: 800,
          letterSpacing: "0.08em",
          lineHeight: 1.25,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        Today
      </div>
    </div>,
    portalTarget,
  );
};
