/// <reference types="jest" />

import { getStatusPillClassName } from "../workspaceUtils";

describe("getStatusPillClassName", () => {
  it("maps success-like statuses to the success class", () => {
    expect(getStatusPillClassName("complete")).toBe("pill status-pill status-pill-success");
    expect(getStatusPillClassName("available")).toBe("pill status-pill status-pill-success");
  });

  it("maps in-progress statuses to the info class", () => {
    expect(getStatusPillClassName("in-progress")).toBe("pill status-pill status-pill-info");
    expect(getStatusPillClassName("purchased")).toBe("pill status-pill status-pill-info");
  });

  it("maps waiting and priority warning statuses to the warning class", () => {
    expect(getStatusPillClassName("requested")).toBe("pill status-pill status-pill-warning");
    expect(getStatusPillClassName("high")).toBe("pill status-pill status-pill-warning");
  });

  it("maps critical statuses to the danger class", () => {
    expect(getStatusPillClassName("critical")).toBe("pill status-pill status-pill-danger");
    expect(getStatusPillClassName("retired")).toBe("pill status-pill status-pill-danger");
  });

  it("uses neutral when no explicit group is mapped", () => {
    expect(getStatusPillClassName("unknown-status")).toBe("pill status-pill status-pill-neutral");
  });
});
