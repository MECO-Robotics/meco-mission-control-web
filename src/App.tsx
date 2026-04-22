import { useState } from "react";

import "./App.css";
import { operationsSnapshot } from "./data/mockData";
import type { RoleFilter } from "./types";

const roleFilters: { key: RoleFilter; label: string }[] = [
  { key: "all", label: "All access" },
  { key: "students", label: "Students" },
  { key: "mentors", label: "Mentors" },
  { key: "admins", label: "Admins" },
];

export default function App() {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const visiblePortals = operationsSnapshot.portals.filter((portal) => {
    return roleFilter === "all" || portal.roles.includes(roleFilter);
  });

  const completionRate = Math.round(
    (operationsSnapshot.metrics.completionRate / 1) * 100,
  );

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">MECO Robotics Browser Access</p>
          <h1>Operations, reviews, and planning dashboards for the whole team.</h1>
          <p className="hero-body">
            This React web app is the desktop companion to the mobile workflow. It
            gives mentors and admins a wider surface for subsystem health, QA queues,
            purchasing, meeting oversight, and planning metrics without pushing those
            heavier workflows into the mobile UI.
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#portals">
              Explore role portals
            </a>
            <a className="secondary-action" href="#deployment">
              View deployment model
            </a>
          </div>
        </div>
        <div className="hero-panel">
          <div className="orb orb-orange" />
          <div className="orb orb-blue" />
          <div className="signal-card">
            <span>Readiness</span>
            <strong>{completionRate}%</strong>
            <p>Tasks completed with work-log and mentor QA signals preserved.</p>
          </div>
          <div className="signal-grid">
            {operationsSnapshot.topSignals.map((signal) => (
              <article className="signal-tile" key={signal.label}>
                <span>{signal.label}</span>
                <strong>{signal.value}</strong>
                <p>{signal.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="stats-strip" aria-label="Summary metrics">
        {operationsSnapshot.summaryCards.map((card) => (
          <article className="summary-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.note}</p>
          </article>
        ))}
      </section>

      <section className="panel-section" id="portals">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Role Portals</p>
            <h2>Website access tuned for how each group works.</h2>
          </div>
          <div className="filter-row" role="tablist" aria-label="Role filters">
            {roleFilters.map((filter) => (
              <button
                key={filter.key}
                className={filter.key === roleFilter ? "filter active" : "filter"}
                onClick={() => setRoleFilter(filter.key)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="portal-grid">
          {visiblePortals.map((portal) => (
            <article className="portal-card" key={portal.title}>
              <div className="card-topline">
                <span>{portal.topline}</span>
                <strong>{portal.metric}</strong>
              </div>
              <h3>{portal.title}</h3>
              <p>{portal.description}</p>
              <ul>
                {portal.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="panel-section">
        <div className="section-heading stacked">
          <div>
            <p className="eyebrow">Workflow Coverage</p>
            <h2>Everything from the requirements doc has a browser home.</h2>
          </div>
          <p className="section-copy">
            The website carries the wider operational views while keeping the same
            completion rules as mobile: required work logs, mentor-backed QA,
            documentation evidence, and linked manufacturing or purchase dependencies.
          </p>
        </div>

        <div className="workflow-grid">
          {operationsSnapshot.workflowLanes.map((lane) => (
            <article className="workflow-card" key={lane.title}>
              <div className="workflow-heading">
                <h3>{lane.title}</h3>
                <span>{lane.metric}</span>
              </div>
              <p>{lane.summary}</p>
              <div className="tag-row">
                {lane.tags.map((tag) => (
                  <span className="tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel-section dashboard-layout">
        <div className="board-card">
          <p className="eyebrow">Subsystem Board</p>
          <h2>At-a-glance progress for standups and mentor review.</h2>
          <div className="subsystem-list">
            {operationsSnapshot.subsystems.map((subsystem) => (
              <article className="subsystem-row" key={subsystem.name}>
                <div>
                  <h3>{subsystem.name}</h3>
                  <p>
                    Lead {subsystem.lead} | Mentor {subsystem.mentor}
                  </p>
                </div>
                <div className="progress-block">
                  <span>{subsystem.progress}% complete</span>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${subsystem.progress}%` }}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="board-column">
          <article className="stack-card">
            <p className="eyebrow">Escalations</p>
            <h3>Today's issues that need leadership attention.</h3>
            <ul className="bullet-list">
              {operationsSnapshot.escalations.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="stack-card">
            <p className="eyebrow">Planning Metrics</p>
            <h3>Metrics gathered for next-build estimation.</h3>
            <ul className="metric-list">
              {operationsSnapshot.metricsTable.map((metric) => (
                <li key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="panel-section deployment-section" id="deployment">
        <div className="section-heading stacked">
          <div>
            <p className="eyebrow">Deployment Shape</p>
            <h2>Three repos, one platform story.</h2>
          </div>
          <p className="section-copy">
            React web and mobile both talk to the shared VPS-hosted API. The web app
            ships as static assets behind nginx, while the server repo owns the
            Fastify API, Prisma schema, and Postgres deployment.
          </p>
        </div>

        <div className="deployment-grid">
          {operationsSnapshot.deploymentCards.map((card) => (
            <article className="deployment-card" key={card.title}>
              <span>{card.repo}</span>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <ul>
                {card.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
