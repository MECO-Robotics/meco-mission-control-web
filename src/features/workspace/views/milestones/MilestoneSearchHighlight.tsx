import { Fragment } from "react";

export type MilestoneSearchHighlightSegment = {
  highlighted: boolean;
  text: string;
};

export function buildMilestoneSearchHighlightSegments(
  text: string,
  searchFilter: string,
): MilestoneSearchHighlightSegment[] {
  const query = searchFilter.trim();

  if (!query) {
    return text ? [{ highlighted: false, text }] : [];
  }

  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  const segments: MilestoneSearchHighlightSegment[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const matchIndex = normalizedText.indexOf(normalizedQuery, cursor);

    if (matchIndex === -1) {
      segments.push({ highlighted: false, text: text.slice(cursor) });
      break;
    }

    if (matchIndex > cursor) {
      segments.push({ highlighted: false, text: text.slice(cursor, matchIndex) });
    }

    const matchEnd = matchIndex + query.length;
    segments.push({ highlighted: true, text: text.slice(matchIndex, matchEnd) });
    cursor = matchEnd;
  }

  return segments;
}

export function MilestoneSearchHighlight({
  searchFilter,
  text,
}: {
  searchFilter: string;
  text: string;
}) {
  return (
    <>
      {buildMilestoneSearchHighlightSegments(text, searchFilter).map((segment, index) =>
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
