import type { UseInteractiveTutorialOptions } from "./useInteractiveTutorialCoreTypes";

import type { InteractiveTutorialCoreState } from "./useInteractiveTutorialCoreState";
import { useInteractiveTutorialCoreActionsSession } from "./useInteractiveTutorialCoreActionsSession";

export function useInteractiveTutorialCoreActions(
  options: UseInteractiveTutorialOptions,
  state: InteractiveTutorialCoreState,
) {
  return useInteractiveTutorialCoreActionsSession(options, state);
}
