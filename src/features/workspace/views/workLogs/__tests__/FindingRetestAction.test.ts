import { isValidElement, useEffect, useState, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { requestItem } from "@/lib/auth/records/common";
import type { QaFindingRecord } from "@/types/recordsReporting";
import { FindingRetestAction } from "../FindingRetestAction";

jest.mock("react", () => ({ ...jest.requireActual("react"), useState: jest.fn(), useEffect: jest.fn() }));
jest.mock("@/lib/auth/records/common", () => ({ requestItem: jest.fn() }));

const useStateMock = jest.mocked(useState);
const useEffectMock = jest.mocked(useEffect);
const requestItemMock = jest.mocked(requestItem);
let slots: unknown[];
let cursor: number;
let effects: Array<() => void>;
const storageValues = new Map<string, string>();

type TestElement = React.ReactElement<{ children?: ReactNode; onClick?: () => void; onChange?: (event: { target: { value: string } }) => void; onSubmit?: (event: { preventDefault: () => void }) => void; required?: boolean }>;

function findElement(node: ReactNode, predicate: (element: TestElement) => boolean): TestElement | null {
  if (Array.isArray(node)) return node.map((child) => findElement(child, predicate)).find(Boolean) ?? null;
  if (!isValidElement(node)) return null;
  const element = node as TestElement;
  if (predicate(element)) return element;
  return findElement(element.props.children, predicate);
}

const finding = { id: "finding-1", retests: [] } as unknown as QaFindingRecord;
const props = { finding, sourceType: "qa" as const, scope: "account:mentor:project:one", canReview: true, members: [] as Array<{ id: string; name: string }>, readFinding: jest.fn(async () => finding) };

function render(componentProps = props) {
  cursor = 0;
  effects = [];
  const tree = FindingRetestAction(componentProps);
  for (const effect of effects) effect();
  return tree;
}

beforeEach(() => {
  slots = [];
  cursor = 0;
  effects = [];
  storageValues.clear();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => storageValues.get(key) ?? null,
    setItem: (key: string, value: string) => storageValues.set(key, value),
    removeItem: (key: string) => storageValues.delete(key),
  } });
  useStateMock.mockImplementation(((initial: unknown) => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = initial;
    return [slots[index], (next: unknown) => { slots[index] = typeof next === "function" ? (next as (previous: unknown) => unknown)(slots[index]) : next; }];
  }) as typeof useState);
  useEffectMock.mockImplementation(((effect: () => void) => { effects.push(effect); }) as typeof useEffect);
  requestItemMock.mockReset();
  props.readFinding.mockReset().mockResolvedValue(finding);
});

afterEach(() => Reflect.deleteProperty(globalThis, "localStorage"));

test("renders canonical retest reviewer, review time, and order from backend fields", () => {
  const html = renderToStaticMarkup(render({
    ...props,
    finding: { ...finding, retests: [{ operationId: "canonical-op", sourceType: "qa", result: "pass", notes: "Checked", reviewedAt: "2026-10-15T12:01:00.000Z", reviewedById: "mentor-1", order: 2 }] },
    members: [{ id: "mentor-1", name: "Mentor" }],
  }));
  expect(html).toContain("Passed · Mentor · reviewed 2026-10-15T12:01:00.000Z · review 2");
});

test("component persists the exact retest before POST and reuses its operation after an uncertain reload", async () => {
  requestItemMock
    .mockRejectedValueOnce(new Error("connection lost"))
    .mockImplementationOnce(async (_path, _method, requestPayload) => ({ id: finding.id, retests: [{ operationId: (requestPayload as { operationId: string }).operationId, result: "pass", notes: "Torque rechecked", reviewedAt: "2026-10-15T12:01:00.000Z", reviewedById: "mentor-1", order: 2 }] }) as never);
  const closed = render();
  const open = findElement(closed, (element) => element.type === "button" && String(element.props.children).includes("Record retest"));
  open?.props.onClick?.();

  let active = render();
  const notes = findElement(active, (element) => element.type === "textarea" && element.props.required === true);
  notes?.props.onChange?.({ target: { value: "Torque checked" } });
  active = render();
  const form = findElement(active, (element) => element.type === "form");
  await form?.props.onSubmit?.({ preventDefault: jest.fn() });

  expect(requestItemMock).toHaveBeenCalledTimes(1);
  const firstPayload = requestItemMock.mock.calls[0][2] as { operationId: string; sourceType: string; result: string; notes: string; observedAt?: string };
  expect(requestItemMock.mock.calls[0][0]).toBe(`/report-findings/${finding.id}/retest`);
  expect(firstPayload).toEqual(expect.objectContaining({ operationId: expect.any(String), sourceType: "qa", result: "pass", notes: "Torque checked", observedAt: expect.any(String) }));
  expect(JSON.parse([...storageValues.values()][0]).payload).toEqual(firstPayload);

  // Simulate a page reload: component memory is cleared, but the durable operation remains.
  slots = [];
  render(); // Apply the state restored from browser storage.
  active = render();
  const retryForm = findElement(active, (element) => element.type === "form");
  await retryForm?.props.onSubmit?.({ preventDefault: jest.fn() });
  expect(requestItemMock).toHaveBeenCalledTimes(2);
  expect(requestItemMock.mock.calls[1][2]).toEqual(firstPayload);
  expect(storageValues.size).toBe(0);
});

test("409 reconciles a changed payload to canonical history and allows a deliberate new check", async () => {
  requestItemMock.mockRejectedValueOnce(Object.assign(new Error("conflict"), { statusCode: 409 }));
  props.readFinding.mockImplementationOnce(async () => {
    const operationId = (requestItemMock.mock.calls[0][2] as { operationId: string }).operationId;
    return { ...finding, retests: [{ operationId, sourceType: "qa", result: "fail", notes: "Prior review", reviewedAt: "server-time", reviewedById: "mentor-1", order: 4 }] } as QaFindingRecord;
  });
  let active = render();
  findElement(active, (element) => element.type === "button" && String(element.props.children).includes("Record retest"))?.props.onClick?.();
  active = render();
  findElement(active, (element) => element.type === "textarea" && element.props.required === true)?.props.onChange?.({ target: { value: "New details" } });
  active = render();
  await findElement(active, (element) => element.type === "form")?.props.onSubmit?.({ preventDefault: jest.fn() });
  await Promise.resolve();
  await Promise.resolve();

  expect(props.readFinding).toHaveBeenCalledWith(finding.id, "qa");
  expect(storageValues.size).toBe(0);
  active = render();
  const markup = renderToStaticMarkup(active);
  expect(markup).toContain("Needs more work · Reviewer unavailable · reviewed server-time · review 4");
  expect(markup).toContain("Your newer details were not recorded");
  expect(requestItemMock).toHaveBeenCalledTimes(1);
});

test("failed canonical refresh retains the same operation across reload and status checks without another write", async () => {
  requestItemMock.mockRejectedValueOnce(Object.assign(new Error("conflict"), { statusCode: 409 }));
  props.readFinding.mockRejectedValue(new Error("offline"));
  let active = render();
  findElement(active, (element) => element.type === "button" && String(element.props.children).includes("Record retest"))?.props.onClick?.();
  active = render();
  findElement(active, (element) => element.type === "textarea" && element.props.required === true)?.props.onChange?.({ target: { value: "Check remains pending" } });
  active = render();
  await findElement(active, (element) => element.type === "form")?.props.onSubmit?.({ preventDefault: jest.fn() });
  expect(storageValues.size).toBe(1);
  const storedPayload = JSON.parse([...storageValues.values()][0]).payload;

  slots = [];
  render();
  active = render();
  expect(findElement(active, (element) => element.type === "button" && String(element.props.children).includes("Check status"))).not.toBeNull();
  findElement(active, (element) => element.type === "button" && String(element.props.children).includes("Check status"))?.props.onClick?.();
  await Promise.resolve();
  active = render();
  expect(renderToStaticMarkup(active)).toContain("saved check is still pending");
  expect(JSON.parse([...storageValues.values()][0]).payload).toEqual(storedPayload);
  expect(requestItemMock).toHaveBeenCalledTimes(1);
});

test("canonical absence requires an explicit new-check action before a new operation is sent", async () => {
  requestItemMock
    .mockRejectedValueOnce(Object.assign(new Error("conflict"), { statusCode: 409 }))
    .mockResolvedValueOnce({ id: finding.id, retests: [] } as never);
  props.readFinding.mockResolvedValueOnce({ ...finding, retests: [] } as QaFindingRecord);
  let active = render();
  findElement(active, (element) => element.type === "button" && String(element.props.children).includes("Record retest"))?.props.onClick?.();
  active = render();
  findElement(active, (element) => element.type === "textarea" && element.props.required === true)?.props.onChange?.({ target: { value: "First check" } });
  active = render();
  await findElement(active, (element) => element.type === "form")?.props.onSubmit?.({ preventDefault: jest.fn() });
  await Promise.resolve();
  await Promise.resolve();
  expect(requestItemMock).toHaveBeenCalledTimes(1);
  expect(storageValues.size).toBe(1);

  active = render();
  findElement(active, (element) => element.type === "button" && String(element.props.children).includes("Start a new check"))?.props.onClick?.();
  active = render();
  expect(requestItemMock).toHaveBeenCalledTimes(1);
  expect(storageValues.size).toBe(0);
  findElement(active, (element) => element.type === "textarea" && element.props.required === true)?.props.onChange?.({ target: { value: "Updated check" } });
  active = render();
  await findElement(active, (element) => element.type === "form")?.props.onSubmit?.({ preventDefault: jest.fn() });
  await Promise.resolve();
  await Promise.resolve();
  expect(requestItemMock).toHaveBeenCalledTimes(2);
  expect((requestItemMock.mock.calls[0][2] as { operationId: string }).operationId).not.toBe((requestItemMock.mock.calls[1][2] as { operationId: string }).operationId);
});
