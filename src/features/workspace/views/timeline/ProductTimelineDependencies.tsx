import { useId, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { buildProductTimelineDependencyPaths } from "./model/productTimelineDependencies";
import type { ProductTimelineBarRect, ProductTimelineDependencyPath, ProductTimelineTaskLink } from "./model/productTimelineDependencies";
import "./productTimelineDependencies.css";

interface ProductTimelineDependenciesProps {
  dependencies: ProductTimelineTaskLink[];
  children: ReactNode;
}

export function ProductTimelineDependencies({ dependencies, children }: ProductTimelineDependenciesProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const markerId = useId().replace(/:/g, "");
  const [paths, setPaths] = useState<ProductTimelineDependencyPath[]>([]);
  const [hoveredBar, setHoveredBar] = useState<HTMLElement | null>(null);
  const [focusedBar, setFocusedBar] = useState<HTMLElement | null>(null);
  const pointerPosition = useRef<{ x: number; y: number } | null>(null);

  const getBar = (target: EventTarget | null) => {
    const bar = target instanceof Element ? target.closest<HTMLElement>(".product-timeline-bar") : null;
    return bar && wrapperRef.current?.contains(bar) ? bar : null;
  };
  const clearPointer = () => {
    pointerPosition.current = null;
    setHoveredBar(null);
  };

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    // A collapse or regroup can remove a bar or move it away from the pointer.
    const point = pointerPosition.current;
    const underPointer = point ? wrapper.ownerDocument.elementFromPoint(point.x, point.y)?.closest(".product-timeline-bar") : null;
    if (hoveredBar && (!wrapper.contains(hoveredBar) || underPointer !== hoveredBar)) setHoveredBar(null);
    const active = wrapper.ownerDocument.activeElement;
    const nextFocusedBar = active instanceof HTMLElement && active.matches(".product-timeline-bar") && wrapper.contains(active) ? active : null;
    if (nextFocusedBar !== focusedBar) setFocusedBar(nextFocusedBar);
  }, [children, hoveredBar, focusedBar]);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const svg = svgRef.current;
    if (!wrapper || !svg) return;
    let frame = 0;
    const measure = () => {
      const track = svg.getBoundingClientRect();
      const bars = Array.from(wrapper.querySelectorAll<HTMLElement>(".product-timeline-task[data-task-id][data-group-key]")).flatMap((row): ProductTimelineBarRect[] => {
        const bar = row.querySelector<HTMLElement>(".product-timeline-bar");
        if (!bar) return [];
        const rect = bar.getBoundingClientRect();
        return [{ taskId: row.dataset.taskId!, groupKey: row.dataset.groupKey!, left: rect.left - track.left, right: rect.right - track.left, top: rect.top - track.top, bottom: rect.bottom - track.top }];
      });
      const next = buildProductTimelineDependencyPaths(dependencies, bars, track.width, track.height);
      setPaths((previous) => previous.length === next.length && previous.every((path, index) => path.key === next[index].key && path.d === next[index].d && path.state === next[index].state && path.type === next[index].type) ? previous : next);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(wrapper);
    wrapper.querySelectorAll(".product-timeline-row").forEach((row) => observer.observe(row));
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [dependencies, children]);

  const activeTaskId = (hoveredBar ?? focusedBar)?.closest<HTMLElement>(".product-timeline-task")?.dataset.taskId;
  const foreground: ProductTimelineDependencyPath[] = [];
  const background: ProductTimelineDependencyPath[] = [];
  for (const path of paths) {
    (activeTaskId && (path.sourceTaskId === activeTaskId || path.targetTaskId === activeTaskId) ? foreground : background).push(path);
  }

  return <div ref={wrapperRef} className="product-timeline-dependencies"
    onPointerOver={(event) => {
      pointerPosition.current = { x: event.clientX, y: event.clientY };
      setHoveredBar(getBar(event.target));
    }}
    onPointerMove={(event) => {
      pointerPosition.current = { x: event.clientX, y: event.clientY };
      setHoveredBar(getBar(event.target));
    }}
    onPointerOut={(event) => setHoveredBar(getBar(event.relatedTarget))}
    onPointerLeave={clearPointer} onPointerCancel={clearPointer}
    onFocusCapture={(event) => setFocusedBar(getBar(event.target))}
    onBlurCapture={(event) => setFocusedBar(getBar(event.relatedTarget))}>
    {children}
    {([ ["background", background], ["foreground", foreground] ] as const).map(([layer, layerPaths]) => <svg key={layer} ref={layer === "background" ? svgRef : undefined} className={`product-timeline-dependency-layer is-${layer}`} aria-hidden="true" focusable="false">
      <defs>{(["waiting", "satisfied", "advisory"] as const).map((state) => <marker key={state} id={`${markerId}-${layer}-${state}`} className={`product-timeline-dependency-marker is-${state}`} viewBox="0 0 6 6" refX="6" refY="3" markerWidth="6" markerHeight="6" markerUnits="userSpaceOnUse" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" /></marker>)}</defs>
      {layerPaths.map((path) => <path key={path.key} className={`product-timeline-dependency is-${path.state}`} d={path.d} markerEnd={`url(#${markerId}-${layer}-${path.state})`} data-dependency-id={path.id} data-type={path.type} data-state={path.state} data-source-task-id={path.sourceTaskId} data-target-task-id={path.targetTaskId} data-group-key={path.groupKey} />)}
    </svg>)}
  </div>;
}
