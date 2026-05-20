import type { OverviewBarDatum, OverviewGraphSegment } from "./overviewViewModel";

interface OverviewHomeGraphsProps {
  schedulePressure: OverviewGraphSegment[];
  workBySubsystem: OverviewBarDatum[];
}

function totalValue(items: Array<{ value: number }>) {
  return items.reduce((sum, item) => sum + item.value, 0);
}

function DonutChart({ segments }: { segments: OverviewGraphSegment[] }) {
  const total = totalValue(segments);
  const arcs = segments
    .filter((segment) => segment.value > 0 && total > 0)
    .reduce<{
      consumed: number;
      items: Array<{ offset: number; segment: OverviewGraphSegment; size: number }>;
    }>(
      (state, segment) => {
        const size = (segment.value / total) * 100;
        return {
          consumed: state.consumed + size,
          items: [...state.items, { offset: -state.consumed, segment, size }],
        };
      },
      { consumed: 0, items: [] },
    ).items;

  return (
    <svg
      aria-label="Schedule pressure chart"
      className="overview-donut-chart"
      role="img"
      viewBox="0 0 100 100"
    >
      <circle className="overview-donut-track" cx="50" cy="50" r="36" />
      {arcs.map(({ offset, segment, size }) => (
        <circle
          className="overview-donut-segment"
          cx="50"
          cy="50"
          data-tone={segment.tone}
          key={segment.id}
          pathLength={100}
          r="36"
          strokeDasharray={`${size} ${100 - size}`}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        />
      ))}
      <text className="overview-donut-value" x="50" y="47">
        {total}
      </text>
      <text className="overview-donut-label" x="50" y="61">
        open
      </text>
    </svg>
  );
}

function GraphLegend({ segments }: { segments: OverviewGraphSegment[] }) {
  return (
    <div className="overview-graph-legend">
      {segments.map((segment) => (
        <span className="overview-legend-item" data-tone={segment.tone} key={segment.id}>
          <i aria-hidden="true" />
          {segment.label}
          <strong>{segment.value}</strong>
        </span>
      ))}
    </div>
  );
}

function BarChart({ items }: { items: OverviewBarDatum[] }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  if (items.length === 0) {
    return <p className="overview-empty-state">No open work by subsystem.</p>;
  }

  return (
    <div className="overview-bar-chart">
      {items.map((item) => (
        <div className="overview-bar-row" data-tone={item.tone} key={item.id}>
          <div className="overview-bar-row-header">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
          <div className="overview-bar-track">
            <span
              className="overview-bar-fill"
              style={{ width: `${Math.max((item.value / max) * 100, 8)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function OverviewHomeGraphs({ schedulePressure, workBySubsystem }: OverviewHomeGraphsProps) {
  return (
    <div className="overview-graph-grid">
      <article className="overview-graph-panel">
        <div className="overview-graph-panel-header">
          <h3>Schedule pressure</h3>
          <span>Open task timing</span>
        </div>
        <div className="overview-donut-layout">
          <DonutChart segments={schedulePressure} />
          <GraphLegend segments={schedulePressure} />
        </div>
      </article>
      <article className="overview-graph-panel">
        <div className="overview-graph-panel-header">
          <h3>Work by subsystem</h3>
          <span>Largest open queues</span>
        </div>
        <BarChart items={workBySubsystem} />
      </article>
    </div>
  );
}
