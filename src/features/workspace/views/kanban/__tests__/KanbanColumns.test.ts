/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { KanbanColumns } from "../KanbanColumns";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("KanbanColumns", () => {
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
