import { createPortal } from "react-dom";

interface TimelineTodayMarkerPortalProps {
  portalTarget: HTMLElement | null;
  todayMarkerLabelTop: number | null;
  todayMarkerLineLeft: number | null;
  todayMarkerLeft: number | null;
  showLabelAtTop?: boolean;
}

export const TimelineTodayMarkerPortal: React.FC<TimelineTodayMarkerPortalProps> = ({
  portalTarget,
  todayMarkerLabelTop,
  todayMarkerLineLeft,
  todayMarkerLeft,
  showLabelAtTop = false,
}) => {
  if (!portalTarget || todayMarkerLeft === null || todayMarkerLineLeft === null || todayMarkerLabelTop === null) {
    return null;
  }

  return createPortal(
    <div
      aria-hidden="true"
      className="timeline-today-marker-column"
      style={{
        left: `${todayMarkerLineLeft}px`,
        position: "absolute",
        top: 0,
        bottom: 0,
        width: 0,
        pointerEvents: "none",
        zIndex: 13,
      }}
    >
      <div
        aria-hidden="true"
        className="timeline-today-marker-line"
        style={{
          position: "absolute",
          top: showLabelAtTop ? "27px" : 0,
          bottom: 0,
          left: 0,
          width: "2px",
          transform: "translateX(-50%)",
          background: "var(--meco-blue)",
        }}
      />
      <div
        aria-hidden="true"
        className="timeline-today-marker-label"
        style={{
          position: "absolute",
          left: `${todayMarkerLeft - todayMarkerLineLeft}px`,
          top: showLabelAtTop ? `${todayMarkerLabelTop - 4}px` : undefined,
          bottom: showLabelAtTop ? undefined : "2px",
          transform: showLabelAtTop ? "translate(-50%, -50%)" : "translateX(-50%)",
          zIndex: 1,
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

