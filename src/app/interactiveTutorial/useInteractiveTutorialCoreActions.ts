import type { UseInteractiveTutorialOptions } from "./core/useInteractiveTutorialCoreTypes";

import type { InteractiveTutorialCoreState } from "./core/useInteractiveTutorialCoreState";
import { useInteractiveTutorialCoreActionsSession } from "./useInteractiveTutorialCoreActionsSession";

export function useInteractiveTutorialCoreActions(
  options: UseInteractiveTutorialOptions,
  state: InteractiveTutorialCoreState,
) {
  return useInteractiveTutorialCoreActionsSession(options, state);
}
