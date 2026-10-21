import { useEffect, type RefObject } from "react";
import { findSearchMatches } from "./searchHighlight";

const highlightName = "workspace-search";
const excludedText = 'input,textarea,select,script,style,svg,dialog,[role="dialog"],[hidden],[aria-hidden="true"],[contenteditable]:not([contenteditable="false"]),mark';

export function useWorkspaceSearchHighlight(query: string, searchRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!query.trim() || typeof CSS === "undefined" || !CSS.highlights || typeof Highlight === "undefined") return;
    const registry = CSS.highlights;
    const highlight = new Highlight();
    registry.set(highlightName, highlight);
    let frame: number | null = null;
    let root: Element | null = null;
    let observer: MutationObserver | null = null;
    const refresh = () => {
      frame = null;
      highlight.clear();
      const content = searchRef.current?.closest(".page-shell")?.querySelector(".workspace-content-clip");
      if (!content) return;
      if (root !== content) {
        observer?.disconnect();
        root = content;
        observer = new MutationObserver(schedule);
        observer.observe(content, { childList: true, characterData: true, subtree: true, attributes: true,
          attributeFilter: ["hidden", "aria-hidden", "contenteditable", "role"] });
      }
      const document = content.ownerDocument;
      const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, {
        acceptNode: node => node.parentElement?.closest(excludedText) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
      });
      let node: Node | null;
      while ((node = walker.nextNode())) {
        for (const match of findSearchMatches(node.textContent ?? "", query)) {
          const range = document.createRange();
          range.setStart(node, match.start);
          range.setEnd(node, match.end);
          highlight.add(range);
        }
      }
    };
    function schedule() {
      if (frame === null) frame = window.requestAnimationFrame(refresh);
    }
    schedule();
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      if (registry.get(highlightName) === highlight) registry.delete(highlightName);
    };
  }, [query, searchRef]);
}
