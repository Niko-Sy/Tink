import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { SocialContext } from "../context/social";
import type { SocialState } from "../context/social";
import { friendService } from "../services/friend";
import type { ApiResponse, PaginatedResponse } from "../services/api";
import type { FriendContact, FriendRequest } from "../types/social";
import { useFriends, useFriendRequests } from "./useFriends";
const value: SocialState = {
  revision: 0,
  capabilities: {
    friends: true,
    directMessages: false,
    roomInvitations: false,
  },
  summary: {
    receivedPendingFriendRequests: 0,
    receivedPendingInvitations: 0,
    directUnreadMessages: 0,
  },
  preview: [],
  totalFriends: 0,
  loading: false,
  error: null,
  addTarget: undefined,
  refresh: () => {},
  openAddFriend: () => {},
  closeAddFriend: () => {},
};
const wrapper = ({ children }: { children: ReactNode }) => (
  <SocialContext.Provider value={value}>{children}</SocialContext.Provider>
);
function page<T>(list: T[]): ApiResponse<PaginatedResponse<T>> {
  return {
    code: 200,
    message: "ok",
    timestamp: "",
    data: { list, total: list.length, page: 1, pageSize: 20, totalPages: 1 },
  };
}
function contact(id: string): FriendContact {
  return {
    profile: {
      userId: id,
      nickname: id,
      avatar: "",
      signature: "",
      availability: "active",
      onlineStatus: null,
    },
    friendSince: "",
    relationship: "friends",
    canMessage: false,
  };
}
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { resolve, promise };
}
describe("social data isolation", () => {
  it("ignores a previous search response arriving after the current response", async () => {
    const old = deferred<ApiResponse<PaginatedResponse<FriendContact>>>();
    const current = deferred<ApiResponse<PaginatedResponse<FriendContact>>>();
    const request = vi
      .spyOn(friendService, "friends")
      .mockReturnValueOnce(old.promise)
      .mockReturnValueOnce(current.promise);
    const { result, rerender } = renderHook(
      ({ q }) => useFriends(q, "all", 1),
      { wrapper, initialProps: { q: "" } },
    );
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    rerender({ q: "bob" });
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    await act(async () => current.resolve(page([contact("bob")])));
    await act(async () => old.resolve(page([contact("old")])));
    expect(result.current.data.list[0].profile.userId).toBe("bob");
  });
  it("preserves the list when refresh fails and exposes a retryable error", async () => {
    vi.spyOn(friendService, "friends")
      .mockResolvedValueOnce(page([contact("bob")]))
      .mockRejectedValueOnce({ message: "暂时失败" });
    const { result, rerender } = renderHook(
      ({ status }) => useFriends("", status, 1),
      { wrapper, initialProps: { status: "all" } },
    );
    await waitFor(() => expect(result.current.data.list).toHaveLength(1));
    rerender({ status: "online" });
    await waitFor(() => expect(result.current.error).toBe("暂时失败"));
    expect(result.current.data.list[0].profile.userId).toBe("bob");
  });
  it("applies a terminal request response immediately to a pending filter", async () => {
    const pending: FriendRequest = {
      requestId: "FR0000000001",
      senderId: "alice",
      receiverId: "bob",
      message: "",
      status: "pending",
      createdAt: "",
      handledAt: null,
      peer: contact("alice").profile,
      direction: "received",
      canAccept: true,
      canReject: true,
      canCancel: false,
    };
    vi.spyOn(friendService, "requests").mockResolvedValue(page([pending]));
    const { result } = renderHook(
      () => useFriendRequests("received", "pending", 1),
      { wrapper },
    );
    await waitFor(() => expect(result.current.data.total).toBe(1));
    act(() => result.current.apply({ ...pending, status: "accepted" }));
    expect(result.current.data.list).toHaveLength(0);
    expect(result.current.data.total).toBe(0);
  });
});
