export interface SearchMatch { start: number; end: number }
export interface SearchHighlightSegment { highlighted: boolean; text: string }

export function findSearchMatches(text: string, search: string): SearchMatch[] {
  const query = search.trim().toLowerCase();
  if (!query) return [];
  const normalized = text.toLowerCase();
  const starts: number[] = [];
  const ends: number[] = [];
  // Lowercasing can expand a character (İ → i + combining dot). Map back to original UTF-16 ranges.
  if (normalized.length !== text.length) {
    let offset = 0;
    for (const character of text) {
      const end = offset + character.length;
      for (let index = 0; index < character.toLowerCase().length; index += 1) {
        starts.push(offset);
        ends.push(end);
      }
      offset = end;
    }
  }
  const matches: SearchMatch[] = [];
  let cursor = 0;
  while (cursor < normalized.length) {
    const index = normalized.indexOf(query, cursor);
    if (index < 0) break;
    const end = index + query.length;
    const match = { start: starts[index] ?? index, end: ends[end - 1] ?? end };
    if (!matches.length || match.start >= matches[matches.length - 1].end) matches.push(match);
    cursor = end;
  }
  return matches;
}

export function buildSearchHighlightSegments(text: string, search: string): SearchHighlightSegment[] {
  const segments: SearchHighlightSegment[] = [];
  let cursor = 0;
  for (const match of findSearchMatches(text, search)) {
    if (match.start > cursor) segments.push({ highlighted: false, text: text.slice(cursor, match.start) });
    segments.push({ highlighted: true, text: text.slice(match.start, match.end) });
    cursor = match.end;
  }
  if (cursor < text.length) segments.push({ highlighted: false, text: text.slice(cursor) });
  return segments;
}
