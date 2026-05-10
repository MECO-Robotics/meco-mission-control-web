/// <reference types="jest" />

import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("AppTopbarSlotPortal", () => {
  it("retries slot host resolution after mount when the host is initially missing", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/layout/AppTopbarSlotPortal.tsx"),
      "utf8",
    );

    expect(source).toContain("const [host, setHost] = useState<HTMLElement | null>");
    expect(source).toContain("const resolveHost = () => {");
    expect(source).toContain("new MutationObserver(resolveHost)");
    expect(source).toContain("observer.observe(document.body, { childList: true, subtree: true })");
    expect(source).toContain("observer.disconnect()");
    expect(source).not.toContain("if (host) {");
  });
});
