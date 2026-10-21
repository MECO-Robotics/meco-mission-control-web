import { buildSearchHighlightSegments, findSearchMatches } from "../searchHighlight";

it("matches trimmed literal phrases case-insensitively, including punctuation and repeated matches", () => {
  expect(findSearchMatches("Robot [v2] robot [v2]", " [V2] ")).toEqual([{ start: 6, end: 10 }, { start: 17, end: 21 }]);
  expect(findSearchMatches("a+b.* a+b.*", "a+b.*")).toEqual([{ start: 0, end: 5 }, { start: 6, end: 11 }]);
  expect(findSearchMatches("Robot robot readiness", "ROBOT")).toEqual([{ start: 0, end: 5 }, { start: 6, end: 11 }]);
  expect(findSearchMatches("aaaa", "aa")).toEqual([{ start: 0, end: 2 }, { start: 2, end: 4 }]);
});

it("preserves UTF-16 offsets when lowercasing expands an earlier character", () => {
  const text = "İ Robot 🦾 ROBOT";
  expect(findSearchMatches(text, "robot")).toEqual([{ start: 2, end: 7 }, { start: 11, end: 16 }]);
  expect(findSearchMatches("İi", "i")).toEqual([{ start: 0, end: 1 }, { start: 1, end: 2 }]);
  expect(findSearchMatches("ΟΣ", "ος")).toEqual([{ start: 0, end: 2 }]);
});

it("never loses or duplicates visible text when producing milestone mark segments", () => {
  for (const [text, query] of [["İ Robot 🦾 ROBOT", "robot"], ["İi", "i"], ["A <b> & A", "a"], ["", "a"], ["No match", "missing"], ["Unchanged", "   "]]) {
    const segments = buildSearchHighlightSegments(text, query);
    expect(segments.map(segment => segment.text).join("")).toBe(text);
    expect(segments.every(segment => segment.text.length > 0)).toBe(true);
  }
  expect(buildSearchHighlightSegments("Robot robot", "robot")).toEqual([
    { highlighted: true, text: "Robot" }, { highlighted: false, text: " " }, { highlighted: true, text: "robot" },
  ]);
  expect(findSearchMatches("text", " ")).toEqual([]);
});
