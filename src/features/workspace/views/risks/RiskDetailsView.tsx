import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { ModalDialog } from "@/components/ModalDialog";

export function RiskDetailsView({ title, kind = "risk", pending = false, className = "", eyebrow, onClose, children }: {
  title: string;
  kind?: "risk" | "task";
  pending?: boolean;
  className?: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const [inline, setInline] = useState(() => typeof window === "undefined" || window.matchMedia("(min-width: 1180px)").matches);
  const heading = useRef<HTMLHeadingElement | null>(null);
  const trigger = useRef(typeof document !== "undefined" && document.activeElement instanceof HTMLElement ? document.activeElement : null);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1180px)");
    const update = () => setInline(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => { if (inline) heading.current?.focus({ preventScroll: true }); }, [inline, title]);
  const close = () => { onClose(); if (trigger.current?.isConnected) trigger.current.focus({ preventScroll: true }); };
  const label = `${kind === "risk" ? "Risk" : "Task"}: ${title}`;
  const content = <section className={`risk-review-context ${className}${inline ? "" : " modal-card task-details-modal"}`} aria-label={label} aria-busy={pending} onKeyDown={(event) => {
    if (inline && event.key === "Escape" && !(event.target instanceof Element && event.target.closest("dialog"))) { event.stopPropagation(); close(); }
  }}>
    <div className="risk-context-heading"><div>{eyebrow ? <p className="risk-details-eyebrow">{eyebrow}</p> : null}<h2 ref={heading} tabIndex={-1}>{title}</h2></div><button className="icon-button task-details-close-button" type="button" aria-label={`Close ${kind} details`} onClick={close}><X size={18} /></button></div>
    {children}
  </section>;
  return inline ? <aside className="risk-review-inspector">{content}</aside> : <ModalDialog className="modal-scrim risk-details-dialog" label={label} onClose={close} dismissOnBackdrop>{content}</ModalDialog>;
}
