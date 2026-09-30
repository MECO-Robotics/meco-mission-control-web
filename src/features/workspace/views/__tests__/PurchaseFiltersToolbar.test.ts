/// <reference types="jest" />

import * as React from "react";
import type { CompactFilterMenuItem } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { PurchaseFiltersToolbar } from "@/features/workspace/views/purchases/PurchaseFiltersToolbar";
import { PURCHASE_APPROVAL_STATUS_OPTIONS, PURCHASE_ORDER_STATUS_OPTIONS } from "@/features/workspace/views/purchases/purchaseListModel";
import type { BootstrapPayload } from "@/types/bootstrap";

describe("PurchaseFiltersToolbar", () => {
  it("filters Purchasing by task project and commercial state", () => {
    const bootstrap = { projects: [{ id: "robot", name: "Robot" }] } as BootstrapPayload;
    const toolbar = PurchaseFiltersToolbar({
      approval: [], bootstrap, search: "", setApproval: jest.fn(), setSearch: jest.fn(), setOrderStatus: jest.fn(),
      setProject: jest.fn(), setVendor: jest.fn(), orderStatus: [], project: [], uniqueVendors: [], vendor: [],
      sortField: "item", sortDirection: "ascending", onSortFieldChange: jest.fn(), onSortDirectionChange: jest.fn(),
    });
    const toolbarContent = toolbar.props.children as React.ReactElement<{ children: unknown }>;
    const search = toolbarContent.props.children as React.ReactElement<{ actions: React.ReactElement<{ children: React.ReactNode }> }>;
    const actions = search.props.actions;
    const menu = React.Children.toArray(actions.props.children)[0] as React.ReactElement<{ items: CompactFilterMenuItem[] }>;
    expect(menu.props.items.map((item) => item.label)).toEqual(["Project", "Order", "Vendor", "Approval"]);
    expect(menu.props.items.map((item) => React.isValidElement(item.content)
      ? (item.content.props as { options?: unknown }).options
      : undefined)).toEqual([
      bootstrap.projects,
      PURCHASE_ORDER_STATUS_OPTIONS,
      [],
      PURCHASE_APPROVAL_STATUS_OPTIONS,
    ]);
  });
});
