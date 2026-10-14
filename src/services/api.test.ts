import { afterEach, describe, it, expect, vi } from "vitest";
import axios from "axios";
import { refreshAccessToken, tokenManager } from "./api";
afterEach(() => localStorage.clear());
describe("refresh credential isolation", () => {
  it("coalesces refresh and stores distinct access and refresh tokens", async () => {
    tokenManager.setRefreshToken("original");
    const post = vi
      .spyOn(axios, "post")
      .mockResolvedValue({
        data: {
          code: 200,
          data: { token: "access", refreshToken: "refresh", expiresIn: 86400 },
        },
      });
    await Promise.all([refreshAccessToken(), refreshAccessToken()]);
    expect(post).toHaveBeenCalledTimes(1);
    expect(tokenManager.getToken()).toBe("access");
    expect(tokenManager.getRefreshToken()).toBe("refresh");
  });
  it("does not apply a delayed refresh after another account logs in", async () => {
    tokenManager.setRefreshToken("old-account");
    let finish!: (r: unknown) => void;
    vi.spyOn(axios, "post").mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const flight = refreshAccessToken();
    const assertion = expect(flight).rejects.toThrow("账号已切换");
    tokenManager.setToken("new-access");
    tokenManager.setRefreshToken("new-refresh");
    finish({
      data: {
        code: 200,
        data: { token: "old-access", refreshToken: "old-refresh" },
      },
    });
    await assertion;
    expect(tokenManager.getToken()).toBe("new-access");
    expect(tokenManager.getRefreshToken()).toBe("new-refresh");
  });
});
