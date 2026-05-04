import { Component, createElement, type ReactNode } from "react";

const ERROR_TOAST_TITLE = "Something went wrong";
const ERROR_TOAST_MESSAGE = "Please refresh the page and try again.";

function AppErrorToast() {
  return createElement(
    "aside",
    { className: "workspace-info-toast", role: "alert", "aria-live": "assertive" },
    createElement(
      "section",
      { className: "workspace-info-toast-card" },
      createElement(
        "div",
        { className: "workspace-info-toast-header" },
        createElement(
          "div",
          null,
          createElement(
            "p",
            { className: "eyebrow", style: { color: "var(--official-red)" } },
            "Error",
          ),
          createElement("h2", null, ERROR_TOAST_TITLE),
        ),
      ),
      createElement("p", { className: "workspace-info-toast-message" }, ERROR_TOAST_MESSAGE),
    ),
  );
}

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
};

export default class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return createElement(AppErrorToast);
    }

    return this.props.children;
  }
}
