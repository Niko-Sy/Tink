import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { SocialContext } from "../../context/social";
import type { SocialState } from "../../context/social";
import { InvitationContext } from "../../context/invitation";
import { invitationService } from "../../services/invitation";
import InvitationPanel from "./InvitationPanel";
import type { RoomInvitation } from "../../types/invitation";
const value: SocialState = {
  revision: 0,
  capabilities: { friends: true, directMessages: true, roomInvitations: true },
  summary: {
    receivedPendingFriendRequests: 0,
    receivedPendingInvitations: 1,
    directUnreadMessages: 0,
  },
  preview: [],
  totalFriends: 0,
  loading: false,
  error: null,
  addTarget: undefined,
  refresh: vi.fn(),
  openAddFriend: vi.fn(),
  closeAddFriend: vi.fn(),
};
const profile = {
  userId: "U100000000",
  nickname: "Alice",
  avatar: "",
  signature: "",
  availability: "active" as const,
  onlineStatus: null,
};
const invitation: RoomInvitation = {
  invitationId: "invitation",
  roomId: "100000000",
  direction: "received",
  status: "pending",
  inviter: profile,
  invitee: { ...profile, userId: "U100000001", nickname: "Bob" },
  room: {
    roomId: "100000000",
    name: "Actual group",
    description: "",
    icon: "",
    type: "private",
    peopleCount: 0,
    onlineCount: 0,
    createdTime: "",
    lastMessageTime: "",
  },
  message: "Keep existing record",
  createdAt: "2026-10-13T00:00:00Z",
  expiresAt: "2026-10-20T00:00:00Z",
  handledAt: null,
  invalidationReason: null,
  canEnter: false,
  canAccept: true,
  canReject: true,
  canCancel: false,
};
const page = (list: RoomInvitation[]) => ({
  code: 200,
  message: "",
  timestamp: "",
  data: { list, total: list.length, page: 1, pageSize: 20, totalPages: 1 },
});
const context = {
  revision: 0,
  options: null,
  managementRoom: null,
  openInvite: vi.fn(),
  closeInvite: vi.fn(),
  openManagement: vi.fn(),
  closeManagement: vi.fn(),
  refresh: vi.fn(),
};
const wrap = (direction = "received") => (
  <SocialContext.Provider value={value}>
    <InvitationContext.Provider value={context}>
      <MemoryRouter>
        <InvitationPanel
          direction={direction}
          status="pending"
          page={1}
          onPage={() => {}}
        />
      </MemoryRouter>
    </InvitationContext.Provider>
  </SocialContext.Provider>
);
describe("invitation query and action isolation", () => {
  it("ignores a delayed previous-direction result", async () => {
    let finish!: (v: ReturnType<typeof page>) => void;
    vi.spyOn(invitationService, "list")
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValueOnce(
        page([{ ...invitation, direction: "sent", message: "New sent view" }]),
      );
    const rendered = render(wrap());
    rendered.rerender(wrap("sent"));
    await screen.findByText("New sent view");
    await act(async () => finish(page([invitation])));
    expect(screen.queryByText("Keep existing record")).toBeNull();
  });
  it("preserves the record on mutation failure and blocks double submission", async () => {
    vi.spyOn(invitationService, "list").mockResolvedValue(page([invitation]));
    let fail!: (e: Error) => void;
    const handle = vi.spyOn(invitationService, "handle").mockImplementation(
      () =>
        new Promise((_, reject) => {
          fail = reject;
        }),
    );
    render(wrap());
    const accept = await screen.findByRole("button", { name: "接受邀请" });
    fireEvent.click(accept);
    fireEvent.click(accept);
    expect(handle).toHaveBeenCalledTimes(1);
    await act(async () => fail(new Error("Network failed")));
    expect(screen.getByText("Keep existing record")).toBeInTheDocument();
    expect(screen.getByText("Network failed")).toBeInTheDocument();
  });
  it("uses committed server membership and keeps an enter-room action after acceptance", async () => {
    vi.spyOn(invitationService, "list").mockResolvedValue(page([invitation]));
    vi.spyOn(invitationService, "handle").mockResolvedValue({
      code: 200,
      message: "",
      timestamp: "",
      data: {
        invitation: {
          ...invitation,
          status: "accepted",
          canAccept: false,
          canReject: false,
        },
        created: false,
        chatroom: invitation.room,
        alreadyMember: false,
      },
    });
    render(wrap());
    fireEvent.click(await screen.findByRole("button", { name: "接受邀请" }));
    await waitFor(() =>
      expect(screen.getByText("已加入聊天室")).toBeInTheDocument(),
    );
    expect(
      screen.getAllByRole("button", { name: "进入聊天室" }).length,
    ).toBeGreaterThan(0);
  });
});
