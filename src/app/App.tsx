import { lazy, Suspense } from "react";

import "@/app/AuthApp.css";
import { AuthStatusScreen } from "@/features/auth/AuthScreens";

const WorkspaceApp = lazy(() => import("./AppWorkspaceCoreImpl"));

export default function App() {
  return (
    <Suspense
      fallback={
        <AuthStatusScreen
          body="Preparing the sign-in and workspace interface."
          isDarkMode={false}
          title="Opening MECO Mission Control."
        />
      }
    >
      <WorkspaceApp />
    </Suspense>
  );
}
