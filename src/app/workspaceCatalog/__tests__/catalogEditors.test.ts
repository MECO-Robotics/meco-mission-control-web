import { useMaterialEditor } from "../materialActions";
import { usePurchaseActions } from "../purchaseActions";
import { buildEmptyMaterialPayload, buildEmptyPurchasePayload } from "@/lib/appUtils/payloadBuilders";
import * as production from "@/lib/auth/records/production";
import { useCallback, useEffect, useRef, useState } from "react";
import { useArtifactActions } from "../artifactActions";
import { useWorkstreamActions } from "../workstreamActions";
import { usePartDefinitionActions } from "../partDefinitionActions";
import { usePartInstanceActions } from "../partInstanceActions";
import { useSubsystemActions } from "../subsystemActions";
import { useMechanismActions } from "../mechanismActions";
import * as inventory from "@/lib/auth/records/inventory";
import * as parts from "@/lib/auth/records/parts";
import * as structure from "@/lib/auth/records/structure";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";

jest.mock("react", () => ({ ...jest.requireActual("react"), useState: jest.fn(), useRef: jest.fn(), useEffect: jest.fn(), useCallback: jest.fn() }));
jest.mock("@/lib/auth/records/inventory");
jest.mock("@/lib/auth/records/parts");
jest.mock("@/lib/auth/records/structure");
jest.mock("@/lib/auth/records/production");

// Match React's stable setters, callbacks and dependency-triggered effects while
// exercising the owners directly, as the existing catalog tests do.
function hookState() {
  const slots: unknown[] = [];
  let cursor = 0;
  const effects: (() => void)[] = [];
  const changed = (previous: readonly unknown[] | undefined, next: readonly unknown[] | undefined) =>
    !previous || !next || previous.length !== next.length || next.some((value, index) => !Object.is(value, previous[index]));
  jest.mocked(useState).mockImplementation((initial?: unknown) => {
    const index = cursor++;
    if (!(index in slots)) {
      const slot = { value: typeof initial === "function" ? initial() : initial, set: (next: unknown) => { slot.value = typeof next === "function" ? next(slot.value) : next; } };
      slots[index] = slot;
    }
    const slot = slots[index] as { value: unknown; set: (value: unknown) => void };
    return [slot.value, slot.set];
  });
  jest.mocked(useRef).mockImplementation((initial) => {
    const index = cursor++;
    return (slots[index] ??= { current: initial }) as ReturnType<typeof useRef>;
  });
  jest.mocked(useCallback).mockImplementation((callback, dependencies) => {
    const index = cursor++;
    const previous = slots[index] as { callback: typeof callback; dependencies: typeof dependencies } | undefined;
    if (!previous || changed(previous.dependencies, dependencies)) slots[index] = { callback, dependencies };
    return (slots[index] as typeof previous)!.callback;
  });
  jest.mocked(useEffect).mockImplementation((effect, dependencies) => {
    const index = cursor++;
    const previous = slots[index] as typeof dependencies;
    if (changed(previous, dependencies)) effects.push(effect);
    slots[index] = dependencies;
  });
  return <T>(render: () => T) => {
    cursor = 0;
    const result = render();
    effects.splice(0).forEach((effect) => effect());
    return result;
  };
}

const cases = [
  { name: "artifact", useOwner: useArtifactActions, collection: "artifacts", create: inventory.createArtifactRecord, update: inventory.updateArtifactRecord },
  { name: "workstream", useOwner: useWorkstreamActions, collection: "workstreams", create: inventory.createWorkstreamRecord, update: inventory.updateWorkstreamRecord },
  { name: "partDefinition", useOwner: usePartDefinitionActions, collection: "partDefinitions", create: parts.createPartDefinitionRecord, update: parts.updatePartDefinitionRecord },
  { name: "partInstance", useOwner: usePartInstanceActions, collection: "partInstances", create: parts.createPartInstanceRecord, update: parts.updatePartInstanceRecord },
  { name: "subsystem", useOwner: useSubsystemActions, collection: "subsystems", create: structure.createSubsystemRecord, update: structure.updateSubsystemRecord },
  { name: "mechanism", useOwner: useMechanismActions, collection: "mechanisms", create: structure.createMechanismRecord, update: structure.updateMechanismRecord },
  { name: "purchase", useOwner: usePurchaseActions, collection: "purchaseItems", create: production.createPurchaseItemRecord, update: production.updatePurchaseItemRecord },
  { name: "material", useOwner: useMaterialEditor, collection: "materials", create: inventory.createMaterialRecord, update: inventory.updateMaterialRecord },
] as const;

beforeEach(() => jest.resetAllMocks());

type Draft = Record<string, unknown>;
function setup(item: typeof cases[number]) {
  const render = hookState();
  const bootstrap = createBootstrap();
  const dependencies = {
    bootstrap, scopedBootstrap: bootstrap, selectedProjectId: bootstrap.projects[0].id,
    selectedSeasonId: bootstrap.projects[0].seasonId, signedInMemberId: bootstrap.members.at(-1)?.id ?? null,
    handleUnauthorized: jest.fn(), loadWorkspace: jest.fn(async () => true), setDataMessage: jest.fn(), setBootstrap: jest.fn(),
  };
  const cap = item.name[0].toUpperCase() + item.name.slice(1);
  const useOwner = item.useOwner as (input: typeof dependencies) => Record<string, unknown>;
  const read = () => {
    const owner = render(() => useOwner(dependencies));
    return {
      raw: owner,
      mode: owner[`${item.name}ModalMode`], draft: owner[`${item.name}Draft`] as Draft,
      saving: owner[`isSaving${cap}`],
      setDraft: owner[`set${cap}Draft`] as (draft: Draft) => void,
      openEdit: owner[`openEdit${cap}Modal`] as (record: Draft) => void,
      openCreate: () => (owner[`openCreate${cap}Modal`] as (...args: unknown[]) => void)(...(item.name === "artifact" ? ["document"] : item.name === "partInstance" ? [bootstrap.mechanisms[0]] : [])),
      close: owner[`close${cap}Modal`] as () => void,
      submit: () => (owner[`handle${cap}Submit`] as (event: unknown) => Promise<void>)({ preventDefault: jest.fn() }),
    };
  };
  read();
  const defaults = item.name === "purchase" ? buildEmptyPurchasePayload(bootstrap)
    : item.name === "material" ? buildEmptyMaterialPayload() : {};
  const record = { ...defaults, ...bootstrap[item.collection][0], id: "editor-record", projectId: bootstrap.projects[0].id, title: "Record", name: "Record", risks: [] } as Draft;
  dependencies.bootstrap = { ...bootstrap, [item.collection]: [record] };
  dependencies.scopedBootstrap = dependencies.bootstrap;
  jest.mocked(item.create).mockResolvedValue(record as never);
  jest.mocked(item.update).mockResolvedValue(record as never);
  return { read, record, dependencies };
}

describe.each(cases)("$name editor ownership", (item) => {
  it("owns its creation defaults and closes a successful save", async () => {
    const { read, dependencies } = setup(item);
    read().openCreate();
    const owner = read();
    expect(owner.mode).toBe("create");
    await owner.submit();
    expect(item.create).toHaveBeenCalledTimes(1);
    expect(dependencies.loadWorkspace).toHaveBeenCalledTimes(1);
    expect(read().mode).toBeNull();
    expect(read().saving).toBe(false);
  });

  it("keeps dirty edits across refresh and leaves a rejected save open", async () => {
    const { read, record, dependencies } = setup(item);
    read().openEdit(record);
    read().setDraft({ ...read().draft, name: "Unsaved", title: "Unsaved" });
    dependencies.bootstrap = { ...dependencies.bootstrap };
    dependencies.scopedBootstrap = { ...dependencies.scopedBootstrap };
    expect(read().draft.name).toBe("Unsaved");
    jest.mocked(item.update).mockRejectedValueOnce(new Error("storage unavailable"));
    await read().submit();
    expect(read().mode).toBe("edit");
    expect(read().draft.name).toBe("Unsaved");
    expect(read().saving).toBe(false);
    expect(dependencies.setDataMessage).toHaveBeenLastCalledWith("storage unavailable");
  });

  it.each(["success", "failure"])("ignores stale %s after another draft opens and suppresses duplicate submit", async (outcome) => {
    const { read, record, dependencies } = setup(item);
    read().openEdit(record);
    let resolve!: (record: never) => void;
    let reject!: (error: Error) => void;
    jest.mocked(item.update).mockImplementationOnce(() => new Promise<never>((yes, no) => { resolve = yes; reject = no; }));
    const owner = read();
    const pending = owner.submit();
    await owner.submit();
    expect(item.update).toHaveBeenCalledTimes(1);
    owner.close();
    read().openEdit(record);
    read().setDraft({ ...read().draft, name: "New draft" });
    const calls = dependencies.setDataMessage.mock.calls.length;
    if (outcome === "success") resolve(record as never); else reject(new Error("old failure"));
    await pending;
    expect(read().mode).toBe("edit");
    expect(read().draft.name).toBe("New draft");
    expect(read().saving).toBe(false);
    expect(dependencies.setDataMessage).toHaveBeenCalledTimes(calls);
    expect(dependencies.loadWorkspace).toHaveBeenCalledTimes(outcome === "success" ? 1 : 0);
  });

  it("closes a missing record and invalidates an editor when project or season changes", () => {
    const { read, record, dependencies } = setup(item);
    read().openEdit(record);
    read();
    dependencies.bootstrap = { ...dependencies.bootstrap, [item.collection]: [] };
    dependencies.scopedBootstrap = dependencies.bootstrap;
    read();
    expect(read().mode).toBeNull();
    read().openCreate();
    read();
    dependencies.selectedProjectId = "other-project";
    read();
    expect(read().mode).toBeNull();
    read().openCreate();
    read();
    dependencies.selectedSeasonId = "other-season";
    read();
    expect(read().mode).toBeNull();
  });
});

it.each(["workstream", "mechanism"] as const)(
  "closes a %s draft when the record leaves view scope",
  (name) => {
    const item = cases.find((candidate) => candidate.name === name)!;
    const { read, record, dependencies } = setup(item);
    read().openEdit(record);
    dependencies.scopedBootstrap = {
      ...dependencies.scopedBootstrap,
      [item.collection]: [],
    };
    read();
    expect(read().mode).toBeNull();
  },
);

it("deletes the active artifact and closes its editor", async () => {
  const { read, record, dependencies } = setup(cases.find((item) => item.name === "artifact")!);
  dependencies.bootstrap = {
    ...dependencies.bootstrap,
    artifacts: [{ ...record, isArchived: false } as never],
  };
  read().openEdit(record);
  const actions = read().raw as ReturnType<typeof useArtifactActions>;

  await actions.handleDeleteArtifact(record.id as string);
  expect(inventory.deleteArtifactRecord).toHaveBeenCalledWith(record.id, dependencies.handleUnauthorized);
  expect(dependencies.loadWorkspace).toHaveBeenCalledTimes(1);
  expect(read().mode).toBeNull();
});

it("preserves material create reorder points and converts edit records to draft payloads", async () => {
  const { read, record } = setup(cases.find((item) => item.name === "material")!);
  read().openCreate();
  read().setDraft({ ...read().draft, name: "Aluminum", onHandQuantity: 9, reorderPoint: 99 });
  await read().submit();
  expect(inventory.createMaterialRecord).toHaveBeenCalledWith(expect.objectContaining({ name: "Aluminum", reorderPoint: 4 }), expect.any(Function));
  read().openEdit(record);
  expect(read().draft).not.toHaveProperty("id");
});

it.each(["", "0", "123.45"])("stores purchase final cost %j as a commercial amount", async (finalCost) => {
  const { read, dependencies } = setup(cases.find((item) => item.name === "purchase")!);
  read().openCreate();
  const editor = read().raw as ReturnType<typeof usePurchaseActions>;
  editor.setPurchaseFinalCost(finalCost);
  read().setDraft({ ...read().draft, title: "Stale free text" });
  await read().submit();
  expect(production.createPurchaseItemRecord).toHaveBeenCalledWith(expect.objectContaining({
    title: "Stale free text",
    taskId: "task-1",
    finalCost: finalCost === "" ? null : { amount: Number(finalCost), currency: "USD" },
  }), dependencies.handleUnauthorized);
});
