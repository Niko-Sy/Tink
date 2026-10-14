import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SocialContext } from "../context/social";
import type { SocialState } from "../context/social";
import { friendService } from "../services/friend";
import Contacts from "./Contacts";
const openAddFriend = vi.fn();
const value: SocialState = {
  revision: 0,
  capabilities: {
    friends: true,
    directMessages: false,
    roomInvitations: false,
  },
  summary: {
    receivedPendingFriendRequests: 2,
    receivedPendingInvitations: 0,
    directUnreadMessages: 0,
  },
  preview: [],
  totalFriends: 0,
  loading: false,
  error: null,
  addTarget: undefined,
  refresh: () => {},
  openAddFriend,
  closeAddFriend: () => {},
};
describe("Contacts", () => {
  it("renders API friends with hidden presence and navigates to a real detail route", async () => {
    vi.spyOn(friendService, "friends").mockResolvedValue({
      code: 200,
      message: "",
      timestamp: "",
      data: {
        list: [
          {
            profile: {
              userId: "U100000001",
              nickname: "Bob",
              avatar: "",
              signature: "Hello",
              availability: "active",
              onlineStatus: null,
            },
            friendSince: "",
            relationship: "friends",
            canMessage: false,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      },
    });
    render(
      <SocialContext.Provider value={value}>
        <MemoryRouter initialEntries={["/contacts"]}>
          <Routes>
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/contacts/:userId" element={<p>真实联系人详情</p>} />
          </Routes>
        </MemoryRouter>
      </SocialContext.Provider>,
    );
    await waitFor(() => expect(screen.getByText("Bob")).toBeInTheDocument());
    expect(screen.getByText(/状态未公开/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "添加好友" }));
    expect(openAddFriend).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("contact-U100000001"));
    expect(screen.getByText("真实联系人详情")).toBeInTheDocument();
  });
  it("does not offer usable actions when the server disables social capabilities", () => {
    render(
      <SocialContext.Provider
        value={{
          ...value,
          capabilities: {
            friends: false,
            directMessages: false,
            roomInvitations: false,
          },
        }}
      >
        <MemoryRouter>
          <Contacts />
        </MemoryRouter>
      </SocialContext.Provider>,
    );
    expect(screen.getByText("好友功能暂未启用")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "添加好友" })).toBeNull();
  });
});
