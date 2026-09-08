import AppWorkspaceCoreImpl from "../AppWorkspaceCoreImpl";
import { useAppWorkspaceController } from "../hooks/useAppWorkspaceController";

jest.mock("@/app/App.css", () => ({}));
jest.mock("../hooks/useAppWorkspaceController", () => ({ useAppWorkspaceController: jest.fn() }));
jest.mock("../shell/AppWorkspaceShellView", () => ({ AppWorkspaceShellView: jest.fn() }));
jest.mock("@/features/auth/AuthScreens", () => ({ AuthStatusScreen: jest.fn(), SignInScreen: jest.fn() }));

it.each([true, false])("offers demo return only when sign-in is not forced (%s)", (forced) => {
  const returnToPublicDemo = jest.fn();
  jest.mocked(useAppWorkspaceController).mockReturnValue({
    auth: { authBooting: false, authConfig: {}, enforcedAuthConfig: {},
      isPublicDemoSession: true, isSignInScreenRequested: true, sessionUser: null,
      isSignInForced: forced, returnToPublicDemo, authMessage: "Sign-out was not confirmed" },
    shell: {},
  } as unknown as ReturnType<typeof useAppWorkspaceController>);
  const screen = AppWorkspaceCoreImpl();
  expect(screen.props.onReturnToPublicDemo).toBe(forced ? undefined : returnToPublicDemo);
  expect(screen.props.authMessage).toBe("Sign-out was not confirmed");
});
