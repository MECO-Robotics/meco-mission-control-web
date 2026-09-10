/// <reference types="jest" />

import { buildAutoArrangedLayouts } from "../robotMapLayout";

describe("buildAutoArrangedLayouts", () => {
  it("is deterministic for unplaced subsystem layouts regardless of input order", () => {
    const unsortedSubsystems = [
      {
        id: "subsystem-b",
        layoutX: null,
        layoutY: null,
        layoutZone: "unplaced",
        layoutView: "top",
        sortOrder: 2,
      },
      {
        id: "subsystem-a",
        layoutX: null,
        layoutY: null,
        layoutZone: "unplaced",
        layoutView: "top",
        sortOrder: 1,
      },
      {
        id: "subsystem-c",
        layoutX: null,
        layoutY: null,
        layoutZone: "unplaced",
        layoutView: "top",
        sortOrder: null,
      },
    ] as const;
    const sortedSubsystems = [unsortedSubsystems[1], unsortedSubsystems[0], unsortedSubsystems[2]];

    expect(buildAutoArrangedLayouts(unsortedSubsystems)).toEqual(
      buildAutoArrangedLayouts(sortedSubsystems),
    );
  });

  it("preserves pinned and existing subsystem positions by only returning unplaced layouts", () => {
    const layouts = buildAutoArrangedLayouts([
      {
        id: "subsystem-pinned",
        layoutX: 0.33,
        layoutY: 0.33,
        layoutZone: "front",
        layoutView: "top",
        sortOrder: 0,
      },
      {
        id: "subsystem-unplaced",
        layoutX: null,
        layoutY: null,
        layoutZone: "unplaced",
        layoutView: "top",
        sortOrder: 1,
      },
    ]);

    expect(layouts["subsystem-pinned"]).toBeUndefined();
    expect(layouts["subsystem-unplaced"]).toEqual({
      layoutX: 0.6666666666666666,
      layoutY: 0.3333333333333333,
      layoutZone: "front",
      layoutView: "top",
      sortOrder: 1,
    });
  });

  it("places multiple unplaced subsystems without reusing an occupied existing slot", () => {
    const layouts = buildAutoArrangedLayouts([
      {
        id: "subsystem-existing-a",
        layoutX: 0.3333333333333333,
        layoutY: 0.3333333333333333,
        layoutZone: "front",
        layoutView: "top",
        sortOrder: 0,
      },
      {
        id: "subsystem-existing-b",
        layoutX: 0.6666666666666666,
        layoutY: 0.3333333333333333,
        layoutZone: "front",
        layoutView: "top",
        sortOrder: 1,
      },
      {
        id: "subsystem-unplaced-a",
        layoutX: null,
        layoutY: null,
        layoutZone: "unplaced",
        layoutView: "top",
        sortOrder: 2,
      },
      {
        id: "subsystem-unplaced-b",
        layoutX: null,
        layoutY: null,
        layoutZone: "unplaced",
        layoutView: "top",
        sortOrder: 3,
      },
    ]);

    expect(Object.keys(layouts)).toEqual(["subsystem-unplaced-a", "subsystem-unplaced-b"]);
    expect(layouts["subsystem-unplaced-a"]).toMatchObject({
      layoutX: 0.3333333333333333,
      layoutY: 0.6666666666666666,
      layoutZone: "rear",
    });
    expect(layouts["subsystem-unplaced-b"]).toMatchObject({
      layoutX: 0.6666666666666666,
      layoutY: 0.6666666666666666,
      layoutZone: "rear",
    });
  });

  it("assigns fallback sort orders after existing subsystem sort orders", () => {
    const layouts = buildAutoArrangedLayouts([
      {
        id: "subsystem-existing",
        layoutX: 0.3333333333333333,
        layoutY: 0.3333333333333333,
        layoutZone: "front",
        layoutView: "top",
        sortOrder: 4,
      },
      {
        id: "subsystem-unplaced-a",
        layoutX: null,
        layoutY: null,
        layoutZone: "unplaced",
        layoutView: "top",
        sortOrder: null,
      },
      {
        id: "subsystem-unplaced-b",
        layoutX: null,
        layoutY: null,
        layoutZone: "unplaced",
        layoutView: "top",
        sortOrder: null,
      },
    ]);

    expect(layouts["subsystem-unplaced-a"].sortOrder).toBe(5);
    expect(layouts["subsystem-unplaced-b"].sortOrder).toBe(6);
  });

  it("reserves slots for all placed cards while only arranging targeted unplaced cards", () => {
    const layouts = buildAutoArrangedLayouts(
      [
        {
          id: "subsystem-visible-existing",
          layoutX: 0.3333333333333333,
          layoutY: 0.3333333333333333,
          layoutZone: "front",
          layoutView: "top",
          sortOrder: 0,
        },
        {
          id: "subsystem-hidden-existing",
          layoutX: 0.6666666666666666,
          layoutY: 0.3333333333333333,
          layoutZone: "front",
          layoutView: "top",
          sortOrder: 1,
        },
        {
          id: "subsystem-visible-unplaced",
          layoutX: null,
          layoutY: null,
          layoutZone: "unplaced",
          layoutView: "top",
          sortOrder: null,
        },
        {
          id: "subsystem-hidden-unplaced",
          layoutX: null,
          layoutY: null,
          layoutZone: "unplaced",
          layoutView: "top",
          sortOrder: null,
        },
      ],
      new Set(["subsystem-visible-existing", "subsystem-visible-unplaced"]),
    );

    expect(Object.keys(layouts)).toEqual(["subsystem-visible-unplaced"]);
    expect(layouts["subsystem-visible-unplaced"]).toMatchObject({
      layoutX: 0.3333333333333333,
      layoutY: 0.6666666666666666,
      layoutZone: "rear",
      sortOrder: 2,
    });
  });
});
