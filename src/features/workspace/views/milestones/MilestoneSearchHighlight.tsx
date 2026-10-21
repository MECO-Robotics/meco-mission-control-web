import { Fragment } from "react";

import { buildSearchHighlightSegments } from "@/features/workspace/shared/search/searchHighlight";

export function MilestoneSearchHighlight({
  searchFilter,
  text,
}: {
  searchFilter: string;
  text: string;
}) {
  return (
    <>
      {buildSearchHighlightSegments(text, searchFilter).map((segment, index) =>
        segment.highlighted ? (
          <mark className="milestone-search-highlight" key={`${segment.text}-${index}`}>
            {segment.text}
          </mark>
        ) : (
          <Fragment key={`${segment.text}-${index}`}>{segment.text}</Fragment>
        ),
      )}
    </>
  );
}
