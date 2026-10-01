/// <reference types="jest" />

import { renderToStaticMarkup } from "react-dom/server";

import { SchedulePresentationSelector } from "../SchedulePresentationSelector";

describe("SchedulePresentationSelector", () => {
  it("exposes the agenda, calendar, and Gantt presentations with the current view selected", () => {
    const markup = renderToStaticMarkup(
      <SchedulePresentationSelector value="timeline" onChange={jest.fn()} />,
    );

    expect(markup).toContain('aria-label="Schedule presentations"');
    expect(markup).toContain(">Agenda</button>");
    expect(markup).toContain(">Calendar</button>");
    expect(markup).toContain('aria-pressed="true" class="is-active">Gantt</button>');
  });
});
