/// <reference types="jest" />

import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

import { SchedulePresentationSelector } from "../SchedulePresentationSelector";
import { ScheduleDateSelector } from "../ScheduleDateSelector";

describe("SchedulePresentationSelector", () => {
  it("exposes the agenda, calendar, and Gantt presentations with the current view selected", () => {
    const markup = renderToStaticMarkup(
      React.createElement(SchedulePresentationSelector, { value: "timeline", onChange: jest.fn() }),
    );

    expect(markup).toContain('aria-label="Schedule presentations"');
    expect(markup).toContain('class="schedule-presentation-tabs timeline-interval-toggle-rail"');
    expect(markup).toContain(">Agenda</button>");
    expect(markup).toContain(">Calendar</button>");
    expect(markup).toContain('aria-pressed="true" class="timeline-interval-toggle-option is-active" type="button">Gantt</button>');
  });
});

describe("ScheduleDateSelector", () => {
  it("renders the shared accessible date control used by every Schedule presentation", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ScheduleDateSelector, { value: "2026-10-01", onChange: jest.fn() }),
    );

    expect(markup).toContain('aria-label="Go to date"');
    expect(markup).toContain('type="date"');
    expect(markup).toContain('value="2026-10-01"');
  });
});
