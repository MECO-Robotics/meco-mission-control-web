import React, { useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TaskAssigneeSummary } from "../TaskAssigneeSummary";
import { createBootstrap } from "../../../__tests__/timeline/timelineTestFixtures";

jest.mock("react", () => ({ ...jest.requireActual("react"), useState: jest.fn() }));

it("falls back after a photo fails and tries a changed photo URL", () => {
  const bootstrap = createBootstrap();
  const member = { ...bootstrap.members[0], name: "  Ada", photoUrl: "https://example.com/failed.png" };
  const props = { task: bootstrap.tasks[0], membersById: { [member.id]: member } };
  let failedPhotoUrl: string | null = null;
  jest.mocked(useState).mockImplementation(() => [failedPhotoUrl, (next: string | null) => { failedPhotoUrl = next; }] as ReturnType<typeof useState>);

  const view = TaskAssigneeSummary(props);
  const photo = (view.props.children as React.ReactElement<React.ImgHTMLAttributes<HTMLImageElement>>[])[0];
  expect(photo.props).toMatchObject({ alt: "", loading: "lazy", referrerPolicy: "no-referrer", src: member.photoUrl });
  photo.props.onError!({} as React.SyntheticEvent<HTMLImageElement>);
  const fallback = renderToStaticMarkup(TaskAssigneeSummary(props));
  expect(fallback).toContain(">A</span>");
  expect(fallback).not.toContain("<img");
  member.photoUrl = "https://example.com/replacement.png";
  expect(renderToStaticMarkup(TaskAssigneeSummary(props))).toContain(`src="${member.photoUrl}"`);
});
