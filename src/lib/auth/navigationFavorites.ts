import { requestApi } from "./core/request";
import type { FavoriteViewRecord } from "@/types/bootstrap";
import type { NavigationSubItemId } from "@/lib/workspaceNavigation";

type NavigationFavoriteUpdateViewId = NavigationSubItemId | "reports-work-logs";

export function updateFavoriteView(
  viewId: NavigationFavoriteUpdateViewId,
  isFavorite: boolean,
  onUnauthorized?: () => void,
) {
  return requestApi<{ favoriteViews: FavoriteViewRecord[] }>(
    `/navigation/favorites/${encodeURIComponent(viewId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isFavorite }),
    },
    onUnauthorized,
  ).then((response) => response.favoriteViews);
}
