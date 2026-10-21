import { buildProductTimelineDependencyPaths, getProductTimelineTaskLinks } from "../../views/timeline/model/productTimelineDependencies";
import type { ProductTimelineBarRect, ProductTimelineDependencyPath, ProductTimelineTaskLink } from "../../views/timeline/model/productTimelineDependencies";
import { createBootstrapWithDependency } from "./timelineTestFixtures";

const link: ProductTimelineTaskLink = { id: "dependency", sourceTaskId: "source", targetTaskId: "target", type: "hard", state: "waiting" };
const bar = (taskId: string, groupKey: string, left: number, right: number, top: number): ProductTimelineBarRect => ({ taskId, groupKey, left, right, top, bottom: top + 22 });

function expectNoEndpointIntersections(path: ProductTimelineDependencyPath, endpoints: ProductTimelineBarRect[]) {
  for (let index = 1; index < path.points.length; index += 1) {
    const a = path.points[index - 1];
    const b = path.points[index];
    expect(a.x === b.x || a.y === b.y).toBe(true);
    for (const endpoint of endpoints) {
      const verticalIntersection = a.x === b.x && a.x > endpoint.left && a.x < endpoint.right && Math.max(a.y, b.y) > endpoint.top && Math.min(a.y, b.y) < endpoint.bottom;
      const horizontalIntersection = a.y === b.y && a.y > endpoint.top && a.y < endpoint.bottom && Math.max(a.x, b.x) > endpoint.left && Math.min(a.x, b.x) < endpoint.right;
      expect(verticalIntersection || horizontalIntersection).toBe(false);
    }
  }
}

describe("product timeline task prerequisite semantics", () => {
  it("points from prerequisite to dependent and respects required task state", () => {
    const bootstrap = createBootstrapWithDependency();
    expect(getProductTimelineTaskLinks(bootstrap)).toEqual([{ id: "dep-1", sourceTaskId: "task-1", targetTaskId: "task-2", type: "hard", state: "waiting" }]);
    bootstrap.taskDependencies[0].requiredState = "in-progress";
    expect(getProductTimelineTaskLinks(bootstrap)[0].state).toBe("satisfied");
    bootstrap.tasks[0].status = "complete";
    expect(getProductTimelineTaskLinks(bootstrap)[0].state).toBe("waiting");
    delete bootstrap.taskDependencies[0].requiredState;
    expect(getProductTimelineTaskLinks(bootstrap)[0].state).toBe("satisfied");
  });

  it("keeps soft links advisory independently of source state", () => {
    const bootstrap = createBootstrapWithDependency();
    bootstrap.taskDependencies[0].dependencyType = "soft";
    expect(getProductTimelineTaskLinks(bootstrap)[0]).toMatchObject({ type: "soft", state: "advisory" });
    bootstrap.tasks[0].status = "complete";
    expect(getProductTimelineTaskLinks(bootstrap)[0].state).toBe("advisory");
  });

  it("omits missing, self and non-task endpoints from the visual links", () => {
    const bootstrap = createBootstrapWithDependency();
    const dependency = bootstrap.taskDependencies[0];
    bootstrap.taskDependencies.push(
      { ...dependency, id: "missing-source", refId: "unknown" },
      { ...dependency, id: "missing-target", taskId: "unknown" },
      { ...dependency, id: "self", refId: dependency.taskId },
      { ...dependency, id: "milestone", kind: "milestone" },
      { ...dependency, id: "part", kind: "part-instance" },
    );
    expect(getProductTimelineTaskLinks(bootstrap).map((item) => item.id)).toEqual(["dep-1"]);
  });
});

describe("product timeline rendered dependency instances", () => {
  it("draws one source per dependent instance, favoring the same group over proximity", () => {
    const bars = [bar("source", "a", 10, 40, 10), bar("source", "b", 20, 50, 90), bar("target", "a", 100, 150, 100), bar("target", "b", 110, 160, 140)];
    const paths = buildProductTimelineDependencyPaths([link], bars, 200, 200);
    expect(paths).toHaveLength(2);
    expect(paths.map((path) => [path.groupKey, path.points[0], path.points.at(-1)])).toEqual([
      ["a", { x: 40, y: 21 }, { x: 100, y: 111 }],
      ["b", { x: 50, y: 101 }, { x: 110, y: 151 }],
    ]);
    expect(new Set(paths.map((path) => path.key)).size).toBe(2);
  });

  it("uses the nearest source with a stable DOM-order tie when no group matches", () => {
    const target = bar("target", "c", 100, 150, 50);
    const first = bar("source", "a", 10, 30, 10);
    const second = bar("source", "b", 20, 40, 90);
    expect(buildProductTimelineDependencyPaths([link], [first, second, target], 200, 200)[0].points[0]).toEqual({ x: 30, y: 21 });
    expect(buildProductTimelineDependencyPaths([link], [first, second, { ...target, top: 70, bottom: 92 }], 200, 200)[0].points[0]).toEqual({ x: 40, y: 101 });
  });

  it("omits hidden or collapsed endpoints, including a zero-size DOM bar", () => {
    const source = bar("source", "a", 10, 40, 10);
    const target = bar("target", "a", 100, 150, 100);
    expect(buildProductTimelineDependencyPaths([link], [source], 200, 200)).toEqual([]);
    expect(buildProductTimelineDependencyPaths([link], [target], 200, 200)).toEqual([]);
    expect(buildProductTimelineDependencyPaths([link], [source, { ...target, right: target.left }], 200, 200)).toEqual([]);
    expect(buildProductTimelineDependencyPaths([link], [source, { ...target, left: 220, right: 240 }], 200, 200)).toEqual([]);
  });
});

describe("product timeline arrow routing", () => {
  it.each([
    ["forward", bar("source", "a", 10, 40, 10), bar("target", "a", 100, 150, 100)],
    ["backward", bar("source", "a", 130, 170, 10), bar("target", "a", 20, 70, 100)],
    ["overlap", bar("source", "a", 10, 140, 10), bar("target", "a", 80, 160, 100)],
    ["upward", bar("source", "a", 130, 170, 100), bar("target", "a", 20, 70, 10)],
    ["clipped at both edges", bar("source", "a", 100, 200, 10), bar("target", "a", 0, 130, 100)],
    ["upward clipped target", bar("source", "a", 100, 200, 100), bar("target", "a", 0, 130, 10)],
    ["full-period bars", bar("source", "a", 0, 200, 10), bar("target", "a", 0, 200, 100)],
  ])("routes %s links outside endpoint interiors and within the track", (_name, source, target) => {
    const [path] = buildProductTimelineDependencyPaths([link], [source, target], 200, 160);
    expect(path.points[0]).toEqual({ x: source.right, y: source.top + 11 });
    if (target.left < 6) {
      const end = path.points.at(-1)!;
      const previous = path.points.at(-2)!;
      expect(end).toEqual({ x: 6, y: source.top < target.top ? target.top : target.bottom });
      expect(previous.x).toBe(end.x);
      expect(Math.abs(previous.y - end.y)).toBeGreaterThanOrEqual(6);
    } else expect(path.points.at(-1)).toEqual({ x: target.left, y: target.top + 11 });
    for (const point of path.points) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(200);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(160);
    }
    expectNoEndpointIntersections(path, [source, target]);
  });

  it("clips measured overhangs without allowing invalid geometry into the SVG", () => {
    const source = bar("source", "a", 100, 202, 10);
    const target = bar("target", "a", -2, 120, 100);
    const [path] = buildProductTimelineDependencyPaths([link], [source, target], 200, 160);
    expect(path.points[0].x).toBe(200);
    expect(path.points.at(-1)).toEqual({ x: 6, y: 100 });
    for (const dimension of [0, -1, NaN, Infinity]) {
      expect(buildProductTimelineDependencyPaths([link], [source, target], dimension, 160)).toEqual([]);
      expect(buildProductTimelineDependencyPaths([link], [source, target], 200, dimension)).toEqual([]);
      expect(buildProductTimelineDependencyPaths([link], [{ ...source, left: dimension === 0 ? NaN : dimension, right: NaN }, target], 200, 160)).toEqual([]);
    }
  });

  it.each([10, 100])("enters a minimum-width left-edge bar from the right with source at y=%s", (sourceTop) => {
    const source = bar("source", "a", 100, 200, sourceTop);
    const target = bar("target", "a", 0, 2, sourceTop === 10 ? 100 : 10);
    const [path] = buildProductTimelineDependencyPaths([link], [source, target], 200, 160);
    const end = path.points.at(-1)!;
    const previous = path.points.at(-2)!;
    expect(end).toEqual({ x: 2, y: target.top + 11 });
    expect(previous).toEqual({ x: 10, y: end.y });
    expect(end.x + 6).toBeLessThanOrEqual(200);
    expectNoEndpointIntersections(path, [source, target]);
  });

  it("keeps a vertical marker inside a narrow track when it can still attach to the bar", () => {
    const source = bar("source", "a", 0, 6, 10);
    const target = bar("target", "a", 0, 6, 100);
    const [path] = buildProductTimelineDependencyPaths([link], [source, target], 6, 160);
    expect(path.points.at(-1)).toEqual({ x: 3, y: 100 });
    expectNoEndpointIntersections(path, [source, target]);
    expect(buildProductTimelineDependencyPaths([link], [source, { ...target, left: 4 }], 6, 160)).toEqual([]);
    expect(buildProductTimelineDependencyPaths([link], [source, target], 5, 160)).toEqual([]);
  });
});
