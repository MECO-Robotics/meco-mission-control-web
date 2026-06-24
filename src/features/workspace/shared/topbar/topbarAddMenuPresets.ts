import type { ReactNode } from "react";

import type { TopbarAddMenuAction } from "../ui/WorkspaceTopbarAddMenu";

type SingleActionInput = Pick<TopbarAddMenuAction, "label" | "onSelect" | "icon">;

export function buildSingleAddMenuAction({ icon, label, onSelect }: SingleActionInput): TopbarAddMenuAction[] {
  return [{ icon, label, onSelect }];
}

export function buildTopbarAddMenuActions(
  first: TopbarAddMenuAction,
  ...rest: TopbarAddMenuAction[]
): TopbarAddMenuAction[] {
  return [first, ...rest];
}

export function makeAddMenuAction(label: string, onSelect: () => void, icon?: ReactNode): TopbarAddMenuAction {
  return { icon, label, onSelect };
}
