/// <reference types="jest" />

import * as React from "react";
import { IconManufacturing, IconPerson, IconTasks } from "@/components/shared/Icons";
import type { CompactFilterMenuItem } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import {
  PURCHASE_APPROVAL_OPTIONS,
  PURCHASE_STATUS_OPTIONS,
} from "@/features/workspace/shared/model/workspaceOptions";
import { PurchaseFiltersToolbar } from "@/features/workspace/views/purchases/PurchaseFiltersToolbar";
import type { BootstrapPayload } from "@/types/bootstrap";

describe("PurchaseFiltersToolbar", () => {
  it("preserves the five filter controls and their active count", () => {
    const bootstrap = {
      members: [{ id: "member-1", name: "Requester" }],
      subsystems: [{ id: "subsystem-1", name: "Drive" }],
    } as BootstrapPayload;
    const uniqueVendors = [{ id: "vendor-1", name: "Vendor" }];
    const setApproval = jest.fn();
    const setRequester = jest.fn();
    const setSearch = jest.fn();
    const setStatus = jest.fn();
    const setSubsystem = jest.fn();
    const setVendor = jest.fn();
    const toolbar = PurchaseFiltersToolbar({
      approval: [],
      bootstrap,
      requester: ["member-1"],
      search: "",
      setApproval,
      setRequester,
      setSearch,
      setStatus,
      setSubsystem,
      setVendor,
      status: [],
      subsystem: ["subsystem-1"],
      uniqueVendors,
      vendor: ["vendor-1"],
      sortField: null,
      sortDirection: "ascending",
      onSortFieldChange: jest.fn(),
      onSortDirectionChange: jest.fn(),
    });
    const toolbarContent = toolbar.props.children as React.ReactElement<{
      children: React.ReactElement;
    }>;
    const search = toolbarContent.props.children as React.ReactElement<{
      actions: React.ReactElement;
    }>;
    const actions = search.props.actions as React.ReactElement<{ children: React.ReactNode }>;
    const filterMenu = React.Children.toArray(actions.props.children)[0] as React.ReactElement;
    const menu = filterMenu as React.ReactElement<{
      activeCount: number;
      items: CompactFilterMenuItem[];
    }>;
    const items = menu.props.items;

    expect(menu.props.activeCount).toBe(3);
    expect(items.map((item) => item.label)).toEqual([
      "Subsystem",
      "Requester",
      "Status",
      "Vendor",
      "Approval",
    ]);

    const dropdowns = items.map((item) => {
      expect(React.isValidElement(item.content)).toBe(true);
      return item.content as React.ReactElement<{
        allLabel: string;
        ariaLabel: string;
        icon: React.ReactElement;
        onChange: (value: FilterSelection) => void;
        options: unknown[];
        value: FilterSelection;
      }>;
    });

    expect(dropdowns.map(({ props }) => [props.allLabel, props.ariaLabel])).toEqual([
      ["All subsystems", "Filter purchases by subsystem"],
      ["All requesters", "Filter purchases by requester"],
      ["All statuses", "Filter purchases by status"],
      ["All vendors", "Filter purchases by vendor"],
      ["All approvals", "Filter purchases by approval status"],
    ]);
    expect(dropdowns.map(({ props }) => props.options)).toEqual([
      bootstrap.subsystems,
      bootstrap.members,
      PURCHASE_STATUS_OPTIONS,
      uniqueVendors,
      PURCHASE_APPROVAL_OPTIONS,
    ]);
    expect(dropdowns.map(({ props }) => props.value)).toEqual([
      ["subsystem-1"],
      ["member-1"],
      [],
      ["vendor-1"],
      [],
    ]);
    expect(dropdowns.map(({ props }) => props.icon.type)).toEqual([
      IconManufacturing,
      IconPerson,
      IconTasks,
      IconTasks,
      IconTasks,
    ]);

    const callbacks = [setSubsystem, setRequester, setStatus, setVendor, setApproval];
    expect(dropdowns.map(({ props }) => props.onChange)).toEqual(callbacks);
    dropdowns.forEach(({ props }, index) => props.onChange([`value-${index}`]));
    callbacks.forEach((callback, index) => {
      expect(callback).toHaveBeenCalledWith([`value-${index}`]);
    });
  });
});
