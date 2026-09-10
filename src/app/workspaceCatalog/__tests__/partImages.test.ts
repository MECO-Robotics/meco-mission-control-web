import { usePartDefinitionActions } from "../partDefinitionActions";
import { updatePartDefinitionRecord } from "@/lib/auth/records/parts";
import { getLocalWorkspaceGeneration } from "@/lib/localWorkspace/session";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";

jest.mock("react", () => ({ ...jest.requireActual("react"), useCallback: (callback: unknown) => callback, useRef: (current: unknown) => ({ current }) }));
jest.mock("@/lib/auth/records/parts", () => ({ updatePartDefinitionRecord: jest.fn() }));
jest.mock("@/lib/localWorkspace/session", () => ({ getLocalWorkspaceGeneration: jest.fn(() => 0) }));
jest.mock("@/lib/auth/core/sessionStorage", () => ({ getSessionGeneration: () => 0 }));

const image = "data:image/png;base64,cGFydA==";
function useSetup() {
  const bootstrap = createBootstrap();
  bootstrap.partDefinitions = [{ id: "part-a", revision: "B", isArchived: false, photoUrl: "before.png" } as never,
    { id: "part-b", revision: "A", photoUrl: "other.png" } as never];
  const setBootstrap = jest.fn<void, [(value: typeof bootstrap) => typeof bootstrap]>();
  jest.mocked(updatePartDefinitionRecord).mockResolvedValue({ ...bootstrap.partDefinitions[0], photoUrl: image });
  const save = usePartDefinitionActions({ bootstrap, setBootstrap, handleUnauthorized: jest.fn() } as never).savePartImage;
  return { save, setBootstrap, bootstrap };
}

beforeEach(() => { jest.mocked(getLocalWorkspaceGeneration).mockReturnValue(0); });

test("saves the still to the selected part without rewriting its other fields", async () => {
  const { save, setBootstrap, bootstrap } = useSetup();
  await save("part-a", "B", image);
  expect(updatePartDefinitionRecord).toHaveBeenCalledWith("part-a", { photoUrl: image }, expect.any(Function));
  expect(setBootstrap).toHaveBeenCalledTimes(1);
  expect(setBootstrap.mock.calls[0][0](bootstrap).partDefinitions.map((part) => part.photoUrl)).toEqual([image, "other.png"]);
});

test("does not attach an image to an outdated or missing part", async () => {
  const { save } = useSetup();
  await expect(save("part-a", "A", image)).rejects.toThrow("current revision");
  await expect(save("missing", "B", image)).rejects.toThrow("current revision");
  expect(updatePartDefinitionRecord).not.toHaveBeenCalled();
});

test("rejects invalid and oversized generated images before writing", async () => {
  const { save } = useSetup();
  await expect(save("part-a", "B", "https://example.test/image.png")).rejects.toThrow("invalid or too large");
  await expect(save("part-a", "B", image + "a".repeat(150_000))).rejects.toThrow("invalid or too large");
  expect(updatePartDefinitionRecord).not.toHaveBeenCalled();
});

test("surfaces write failures and does not publish the failed image", async () => {
  const { save, setBootstrap } = useSetup();
  jest.mocked(updatePartDefinitionRecord).mockRejectedValueOnce(new Error("Storage is full"));
  await expect(save("part-a", "B", image)).rejects.toThrow("Storage is full");
  expect(setBootstrap).not.toHaveBeenCalled();
});

test("does not update a different workspace after an in-flight save", async () => {
  const { save, setBootstrap } = useSetup();
  jest.mocked(updatePartDefinitionRecord).mockImplementationOnce(async () => {
    jest.mocked(getLocalWorkspaceGeneration).mockReturnValue(1);
    return {} as never;
  });
  await expect(save("part-a", "B", image)).rejects.toThrow("workspace changed");
  expect(setBootstrap).not.toHaveBeenCalled();
});
