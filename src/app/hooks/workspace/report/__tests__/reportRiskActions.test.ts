import { useCallback } from "react";
import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import { updateRiskRecord } from "@/lib/auth/records/reporting";
import { useAppWorkspaceReportRiskActions } from "../useAppWorkspaceReportRiskActions";

jest.mock("react", () => ({ ...jest.requireActual("react"), useCallback: jest.fn((callback) => callback) }));
jest.mock("@/lib/auth/records/reporting", () => ({ createRiskRecord: jest.fn(), deleteRiskRecord: jest.fn(), updateRiskRecord: jest.fn() }));

function useSetup() {
  jest.mocked(useCallback).mockImplementation((callback) => callback);
  const model = { setDataMessage: jest.fn(), handleUnauthorized: jest.fn(), loadWorkspace: jest.fn(async () => true) };
  return { model, actions: useAppWorkspaceReportRiskActions(model as unknown as AppWorkspaceModel) };
}

it("patches only supplied risk fields and preserves explicit clearing", async () => {
  const { model, actions } = useSetup();
  await actions.handleUpdateRisk("risk-1", { ownerMemberId: null, mitigationDueDate: " 2026-10-20 ", title: " Risk " });
  expect(updateRiskRecord).toHaveBeenCalledWith("risk-1", { ownerMemberId: null, mitigationDueDate: "2026-10-20", title: "Risk" }, model.handleUnauthorized);
  expect(model.loadWorkspace).toHaveBeenCalledTimes(1);
});

it("keeps an acknowledged patch successful when workspace refresh reports failure", async () => {
  const { model, actions } = useSetup();
  model.loadWorkspace.mockResolvedValue(false);
  await expect(actions.handleUpdateRisk("risk-1", { status: "resolved" })).resolves.toBeUndefined();
  expect(model.setDataMessage).toHaveBeenCalledTimes(1);
});

it("reports rejected patches without refreshing and allows the caller to retain its draft", async () => {
  const { model, actions } = useSetup();
  const failure = new Error("Permission denied");
  jest.mocked(updateRiskRecord).mockRejectedValueOnce(failure);
  await expect(actions.handleUpdateRisk("risk-1", { severity: "critical" })).rejects.toBe(failure);
  expect(model.loadWorkspace).not.toHaveBeenCalled();
  expect(model.setDataMessage).toHaveBeenLastCalledWith("Permission denied");
});
