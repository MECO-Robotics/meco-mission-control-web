/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { KanbanColumns } from "../KanbanColumns";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("KanbanColumns", () => {
  it("renders one status heading and separate lane drop cells with every item exactly once", () => {
    const markup = renderToStaticMarkup(
      React.createElement(KanbanColumns<"open", { id: string }>, {
        boardClassName: "board",
        columnBodyClassName: "column-body",
        columnClassName: "column",
        columnEmptyClassName: "empty",
        columnHeaderClassName: "column-header",
        columnCountClassName: "column-count",
        columns: [{ state: "open", header: "Open", count: 2 }],
        emptyLabel: "No items",
        getItemId: (item) => item.id,
        onItemDrop: jest.fn(),
        itemsByState: { open: [{ id: "first" }, { id: "second" }] },
        swimlaneGroups: [
          { id: "robot", label: "Robot", lanes: [
            { id: "a", header: "Design", itemsByState: { open: [{ id: "first" }] } },
            { id: "b", header: "Software", itemsByState: { open: [{ id: "second" }] } },
          ] },
          { id: "outreach", label: "Outreach", lanes: [
            { id: "c", header: "Design", itemsByState: { open: [] } },
          ] },
        ],
        renderItem: (item) => React.createElement("article", null, item.id),
      }),
    );
    expect(markup.match(/class="column-header"/g)).toHaveLength(1);
    expect(markup.match(/data-kanban-drop-state="open"/g)).toHaveLength(3);
    expect([...markup.matchAll(/class="column-count kanban-swimlane-cell-count">(\d+)<\/span>/g)]
      .map((match) => Number(match[1]))).toEqual([1, 1, 0]);
    expect(markup).toContain('class="column-count">2</span>');
    expect(markup.match(/<article>first<\/article>/g)).toHaveLength(1);
    expect(markup.match(/<article>second<\/article>/g)).toHaveLength(1);
    expect(markup).toContain("No items");
    expect(markup).toContain("Software");
    expect(markup.match(/class="kanban-project-label"><span>Robot<\/span><\/h3>/g)).toHaveLength(1);
    expect(markup.match(/class="kanban-project-group"/g)).toHaveLength(2);
  });

  it("assigns stable keys to rendered items when drag identifiers are unavailable", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      const markup = renderToStaticMarkup(
        React.createElement(KanbanColumns<"open", { title: string }>, {
          boardClassName: "board",
          columnBodyClassName: "column-body",
          columnClassName: "column",
          columnEmptyClassName: "empty",
          columnHeaderClassName: "column-header",
          columnCountClassName: "column-count",
          columns: [{ state: "open", header: "Open", count: 2 }],
          emptyLabel: "No items",
          itemsByState: { open: [{ title: "First" }, { title: "Second" }] },
          renderItem: (item: { title: string }) => React.createElement("article", null, item.title),
        }),
      );

      expect(markup).toContain("First");
      expect(markup).toContain("Second");
      expect(consoleError.mock.calls.flat().join(" ")).not.toContain(
        'Each child in a list should have a unique "key" prop',
      );
    } finally {
      consoleError.mockRestore();
    }
  });
});
