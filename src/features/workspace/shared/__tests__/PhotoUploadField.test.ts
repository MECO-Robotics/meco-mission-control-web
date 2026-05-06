/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { PhotoUploadField } from "@/features/workspace/shared/media/PhotoUploadField";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("PhotoUploadField", () => {
  it("renders a photo input and preview controls", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PhotoUploadField, {
        currentUrl: "https://cdn.example.test/photo.png",
        label: "Subsystem photo",
        onUpload: jest.fn(),
        onChange: jest.fn(),
      }),
    );

    expect(markup).toContain("Subsystem photo");
    expect(markup).toContain('type="file"');
    expect(markup).toContain('accept="image/');
    expect(markup).toContain("Clear file");
  });

  it("renders video media previews when the upload accepts video files", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PhotoUploadField, {
        accept: "image/*,video/*",
        currentUrl: "https://cdn.example.test/review-clip.mp4",
        label: "QA report media",
        onUpload: jest.fn(),
        onChange: jest.fn(),
      }),
    );

    expect(markup).toContain("QA report media");
    expect(markup).toContain('accept="image/*,video/*"');
    expect(markup).toContain("<video");
    expect(markup).toContain("controls");
  });
});
