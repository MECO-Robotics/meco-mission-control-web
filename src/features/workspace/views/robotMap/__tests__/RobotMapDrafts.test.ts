import { useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import type { SubsystemLayoutFields } from "@/lib/appUtils/subsystemLayout";
import { RobotMapView } from "../RobotMapView";
import { RobotMapCanvas } from "../RobotMapCanvas";

jest.mock("react", () => ({ ...jest.requireActual("react"), useCallback: jest.fn((callback) => callback), useState: jest.fn(), useRef: jest.fn(), useEffect: jest.fn(), useMemo: jest.fn((factory) => factory()) }));
type CanvasProps = React.ComponentProps<typeof RobotMapCanvas>;
function canvas(node: ReactNode): CanvasProps | undefined {
  if (Array.isArray(node)) return node.map(canvas).find(Boolean);
  if (!node || typeof node !== "object" || !("props" in node)) return;
  const element = node as ReactElement<{ children?: ReactNode }>;
  return element.type === RobotMapCanvas ? element.props as CanvasProps : canvas(element.props.children);
}

it("shows refreshed server layouts outside pending edits and clears only acknowledged draft versions", async () => {
  const states: unknown[] = ["", "map"];
  const refs: Array<{ current: unknown }> = [];
  let stateCursor = 0;
  let refCursor = 0;
  jest.mocked(useEffect).mockImplementation(() => {});
  jest.mocked(useMemo).mockImplementation((factory) => factory());
  jest.mocked(useState).mockImplementation((initial?: unknown) => {
    const index = stateCursor++;
    if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
    return [states[index], (next: unknown) => { states[index] = typeof next === "function" ? next(states[index]) : next; }];
  });
  jest.mocked(useRef).mockImplementation((initial: unknown) => refs[refCursor++] ?? (refs[refCursor - 1] = { current: initial }));
  const initial = createBootstrap();
  initial.subsystems.push({ ...initial.subsystems[0], id: "other-subsystem", name: "Other subsystem" });
  let bootstrap = { ...initial, subsystems: initial.subsystems.map((subsystem) => ({ ...subsystem, layoutX: 0.2, layoutY: 0.3, layoutView: "top" as const, layoutZone: "front" as const })) };
  const id = bootstrap.subsystems[0].id;
  const finishes: Array<(result: boolean) => void> = [];
  const save = jest.fn(() => new Promise<boolean>((resolve) => finishes.push(resolve)));
  const render = () => {
    stateCursor = 0; refCursor = 0;
    return canvas(RobotMapView({ bootstrap, saveSubsystemLayout: save, handleDeleteMechanism: jest.fn(), openCreateMechanismModal: jest.fn(), openCreatePartInstanceModal: jest.fn(), openCreateSubsystemModal: jest.fn(), openEditMechanismModal: jest.fn(), openEditPartInstanceModal: jest.fn(), openEditSubsystemModal: jest.fn(), removePartInstanceFromMechanism: jest.fn(), updateSubsystemConfiguration: jest.fn() }))!;
  };
  const x = () => render().subsystems.find((subsystem) => subsystem.id === id)!.layout.layoutX;
  expect(x()).toBe(0.2);
  bootstrap = { ...bootstrap, subsystems: bootstrap.subsystems.map((subsystem) => ({ ...subsystem, layoutX: 0.4 })) };
  expect(x()).toBe(0.4);
  const layout: SubsystemLayoutFields = { layoutX: 0.6, layoutY: 0.5, layoutView: "top", layoutZone: "front", sortOrder: 0 };
  const first = render().onLayoutDrop(id, layout);
  expect(x()).toBe(0.6);
  bootstrap = { ...bootstrap, subsystems: bootstrap.subsystems.map((subsystem) => subsystem.id === "other-subsystem" ? { ...subsystem, layoutX: 0.45 } : subsystem) };
  expect(render().subsystems.find((subsystem) => subsystem.id === "other-subsystem")!.layout.layoutX).toBe(0.45);
  expect(x()).toBe(0.6);
  const second = render().onLayoutDrop(id, { ...layout, layoutX: 0.8 });
  finishes[0](true);
  await first;
  expect(x()).toBe(0.8);
  bootstrap = { ...bootstrap, subsystems: bootstrap.subsystems.map((subsystem) => ({ ...subsystem, layoutX: 0.8 })) };
  finishes[1](true);
  await second;
  bootstrap = { ...bootstrap, subsystems: bootstrap.subsystems.map((subsystem) => ({ ...subsystem, layoutX: 0.9 })) };
  expect(x()).toBe(0.9);
});
