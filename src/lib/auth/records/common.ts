import { requestApi } from "../core/request";

export async function requestItem<TItem, TPayload>(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  payload?: TPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: TItem }>(
    path,
    method === "DELETE"
      ? { method }
      : {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
    onUnauthorized,
  );

  return response.item;
}
