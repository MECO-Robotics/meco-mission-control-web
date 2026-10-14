import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FilterDropdown } from "../../shared/filters/FilterDropdown";
import { RiskEditorModal } from "../RiskEditorModal";
import { toRiskPayload } from "../riskViewData/riskViewDataPayload";
import { createBootstrap } from "./riskViewTestFixtures";

jest.mock("../../shared/filters/FilterDropdown", () => ({ FilterDropdown: jest.fn(() => null) }));

it("preserves complete purchase and manufacturing identities when selecting attachments", () => {
  let draft = toRiskPayload(createBootstrap().risks[0]);
  const options = [
    { id: "purchase-item:purchase:2026:one", name: "Purchase · Bearings" },
    { id: "manufacturing-details:task:cnc:one", name: "Manufacturing · Side plate" },
  ];
  const setDraft: React.Dispatch<React.SetStateAction<typeof draft>> = next => { draft = typeof next === "function" ? next(draft) : next; };
  renderToStaticMarkup(React.createElement(RiskEditorModal, {
    draft, editorMode: "edit", editorError: null, isDeleting: false, isSaving: false,
    targetOptions: options, mitigationTaskOptions: [], responsibleGroupOptions: [], ownerOptions: [],
    onClose: jest.fn(), onDelete: jest.fn(), onSave: jest.fn(), setDraft,
  }));
  const selector = jest.mocked(FilterDropdown).mock.calls[0][0];
  selector.onChange(options.map(option => option.id));
  expect(draft.relatedTargets).toEqual([
    { kind: "purchase-item", id: "purchase:2026:one" },
    { kind: "manufacturing-details", id: "task:cnc:one" },
  ]);
});
