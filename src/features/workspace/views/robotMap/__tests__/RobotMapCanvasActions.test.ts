/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { RobotMapCanvasActions, RobotMapResetConfirmation } from "../RobotMapCanvasActions";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("RobotMapCanvasActions", () => {
  it("keeps destructive reset behind a confirmation panel", () => {
    const initialMarkup = renderToStaticMarkup(
      React.createElement(RobotMapCanvasActions, {
        onAddSubsystem: jest.fn(),
        onResetLayout: jest.fn(),
      }),
    );
    const confirmationMarkup = renderToStaticMarkup(
      React.createElement(RobotMapResetConfirmation, {
        onConfirm: jest.fn(),
      }),
    );

    expect(initialMarkup).toContain("Reset");
    expect(initialMarkup).not.toContain("Confirm");
    expect(confirmationMarkup).toContain("Are you sure?");
    expect(confirmationMarkup).toContain("Confirm");
    expect(confirmationMarkup).toContain('role="menu"');
  });
});
