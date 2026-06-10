/// <reference types="jest" />

import { requestDevBypassSignIn } from "../session";
import { postJson } from "../core/request";

jest.mock("../core/request", () => ({
  fetchCurrentUser: jest.fn(),
  isApiErrorLike: jest.fn(),
  postJson: jest.fn(),
}));

const postJsonMock = postJson as jest.Mock;

describe("requestDevBypassSignIn", () => {
  it("submits the selected local dev role", () => {
    postJsonMock.mockReturnValue(Promise.resolve({}));

    void requestDevBypassSignIn("mentor");

    expect(postJsonMock).toHaveBeenCalledWith("/auth/dev-bypass", { role: "mentor" });
  });

  it("defaults to student mode", () => {
    postJsonMock.mockReturnValue(Promise.resolve({}));

    void requestDevBypassSignIn();

    expect(postJsonMock).toHaveBeenCalledWith("/auth/dev-bypass", { role: "student" });
  });
});
