import { useCallback, useState } from "react";
import { useMaterialEditor } from "../materialActions";
import { createMaterialRecord, updateMaterialRecord } from "@/lib/auth/records/inventory";

jest.mock("react", () => ({ ...jest.requireActual("react"), useState: jest.fn(), useCallback: jest.fn((callback) => callback) }));
jest.mock("@/lib/auth/records/inventory", () => ({ createMaterialRecord: jest.fn(), updateMaterialRecord: jest.fn(), deleteMaterialRecord: jest.fn() }));

it("owns create/edit drafts across workspace refreshes and keeps failed edits open", async () => {
  const state: unknown[] = [];
  let cursor = 0;
  jest.mocked(useCallback).mockImplementation((callback) => callback);
  jest.mocked(useState).mockImplementation((initial?: unknown) => {
    const index = cursor++;
    if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial;
    return [state[index], (next: unknown) => { state[index] = typeof next === "function" ? next(state[index]) : next; }];
  });
  const dependencies = { handleUnauthorized: jest.fn(), loadWorkspace: jest.fn(async () => {}), setDataMessage: jest.fn() };
  const useEditor = () => { cursor = 0; return useMaterialEditor(dependencies); };
  let editor = useEditor();
  editor.openCreateMaterialModal();
  editor = useEditor();
  editor.setMaterialDraft({ ...editor.materialDraft, name: "Aluminum", onHandQuantity: 8 });
  // A shell/workspace rerender does not replace an unsaved draft.
  editor = useEditor();
  expect(editor.materialDraft.name).toBe("Aluminum");
  jest.mocked(createMaterialRecord).mockResolvedValue({} as never);
  await editor.handleMaterialSubmit({ preventDefault: jest.fn() } as never);
  expect(createMaterialRecord).toHaveBeenCalledWith(expect.objectContaining({ name: "Aluminum", reorderPoint: 4 }), dependencies.handleUnauthorized);
  expect(useEditor().materialModalMode).toBeNull();
  editor.openEditMaterialModal({ ...editor.materialDraft, id: "material-1" });
  editor = useEditor();
  expect(editor.materialDraft).not.toHaveProperty("id");
  jest.mocked(updateMaterialRecord).mockRejectedValue(new Error("storage unavailable"));
  await editor.handleMaterialSubmit({ preventDefault: jest.fn() } as never);
  expect(useEditor().materialModalMode).toBe("edit");
  expect(useEditor().materialDraft.name).toBe("Aluminum");
  expect(dependencies.setDataMessage).toHaveBeenLastCalledWith("storage unavailable");
});
