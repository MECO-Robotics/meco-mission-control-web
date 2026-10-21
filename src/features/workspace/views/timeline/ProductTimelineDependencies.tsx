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
    wrapper.querySelectorAll(".product-timeline-row, .product-timeline-inspection").forEach((row) => observer.observe(row));
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [dependencies, children]);

  return <div ref={wrapperRef} className="product-timeline-dependencies">
    {children}
    <svg ref={svgRef} className="product-timeline-dependency-layer" aria-hidden="true" focusable="false">
      <defs>{(["waiting", "satisfied", "advisory"] as const).map((state) => <marker key={state} id={`${markerId}-${state}`} className={`product-timeline-dependency-marker is-${state}`} viewBox="0 0 6 6" refX="6" refY="3" markerWidth="6" markerHeight="6" markerUnits="userSpaceOnUse" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" /></marker>)}</defs>
      {paths.map((path) => <path key={path.key} className={`product-timeline-dependency is-${path.state}`} d={path.d} markerEnd={`url(#${markerId}-${path.state})`} data-dependency-id={path.id} data-type={path.type} data-state={path.state} data-source-task-id={path.sourceTaskId} data-target-task-id={path.targetTaskId} data-group-key={path.groupKey} />)}
    </svg>
  </div>;
}
