export type TaskEditIntentState = "blocked" | "waiting-on-dependency";

export interface OpenEditTaskModalOptions {
  intentState?: TaskEditIntentState;
}
