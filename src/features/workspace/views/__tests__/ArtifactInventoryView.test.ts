/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { ArchiveFilterCheckbox } from "@/features/workspace/shared/filters/ArchiveFilterCheckbox";
import { ArtifactInventoryView } from "@/features/workspace/views/ArtifactInventoryView";
import type { BootstrapPayload } from "@/types/bootstrap";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const bootstrap: BootstrapPayload = {
  ...EMPTY_BOOTSTRAP,
  projects: [
    {
      id: "project-1",
      seasonId: "season-1",
      name: "Operations",
      projectType: "operations",
      description: "",
      status: "active",
    },
  ],
  workstreams: [
    {
      id: "workstream-1",
      projectId: "project-1",
      name: "Media",
      description: "",
    },
  ],
  artifacts: [
    {
      id: "artifact-1",
      projectId: "project-1",
      workstreamId: "workstream-1",
      kind: "document",
      title: "Brand guide",
      summary: "",
      status: "draft",
      link: "",
      updatedAt: "2026-04-25T12:00:00.000Z",
    },
    {
      id: "artifact-2",
      projectId: "project-1",
      workstreamId: "workstream-1",
      kind: "nontechnical",
      title: "Sponsor packet",
      summary: "",
      status: "in-review",
      link: "",
      updatedAt: "2026-04-25T12:00:00.000Z",
    },
  ],
};

describe("ArtifactInventoryView", () => {
  it("can merge document and non-technical artifacts into one Documents view", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ArtifactInventoryView, {
        artifacts: bootstrap.artifacts,
        bootstrap,
        createKind: "document",
        kinds: ["document", "nontechnical"],
        openCreateArtifactModal: jest.fn(),
        openEditArtifactModal: jest.fn(),
        title: "Documents",
      }),
    );

    expect(markup).toContain("Brand guide");
    expect(markup).toContain("Sponsor packet");
    expect(markup).toContain('resource-list-primary-cell" data-label="Artifact"');
    expect(markup).toContain("Documents");
    expect(markup).not.toContain("Artifact inventory scoped to this project selection.");
    expect(markup).toContain('aria-label="Artifact filters"');
    expect(markup).not.toContain('aria-label="Show archived"');
    expect(markup).not.toContain("archive-filter-toggle");
    expect(markup).not.toContain("Non-Technical");
  });

  it("uses the shared archive checkbox control", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ArchiveFilterCheckbox, {
        checked: true,
        label: "Show archived",
        onChange: jest.fn(),
      }),
    );

    expect(markup).toContain('aria-label="Show archived"');
    expect(markup).toContain('type="checkbox"');
    expect(markup).toContain("checked=\"\"");
  });
});
