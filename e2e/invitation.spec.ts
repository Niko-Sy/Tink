import { test, expect } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";
const base = "http://127.0.0.1:18080/api/v1";
async function identity(ctx: BrowserContext, name: string) {
  const r = await ctx.request.post(`${base}/auth/login`, {
    data: { username: name, password: "Testpass123!" },
  });
  expect(r.ok()).toBeTruthy();
  const d = (await r.json()).data;
  return { token: d.token as string, id: d.user.userId as string };
}
async function enter(page: Page, name: string) {
  await page.goto("/login");
  await page.getByPlaceholder("请输入账号").fill(name);
  await page
    .getByPlaceholder("请输入密码", { exact: true })
    .fill("Testpass123!");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL(/11451\/$/);
}
async function friends(
  ctx: BrowserContext,
  a: { token: string; id: string },
  b: { token: string; id: string },
) {
  const headers = { Authorization: `Bearer ${a.token}` };
  const rel = await ctx.request.get(`${base}/users/${b.id}/relationship`, {
    headers,
  });
  const state = (await rel.json()).data;
  if (state.state === "friends") return;
  if (state.state === "incoming_pending") {
    await ctx.request.post(
      `${base}/friends/requests/${state.pendingRequestId}/accept`,
      { headers, data: {} },
    );
    return;
  }
  const r = await ctx.request.post(`${base}/friends/requests`, {
    headers,
    data: { toUserId: b.id },
  });
  const i = (await r.json()).data.request.requestId;
  await ctx.request.post(`${base}/friends/requests/${i}/accept`, {
    headers: { Authorization: `Bearer ${b.token}` },
    data: {},
  });
}
async function room(ctx: BrowserContext, token: string, type: string) {
  const r = await ctx.request.post(`${base}/chatroom/createroom`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: `Invitation ${type} ${Date.now()}`,
      type,
      password: "private-secret",
    },
  });
  expect(r.ok()).toBeTruthy();
  return (await r.json()).data.chatroom as { roomId: string; name: string };
}
test("contact invitation, combined request center, two tabs, private join and refresh", async ({
  browser,
}) => {
  const a = await browser.newContext();
  const b = await browser.newContext();
  const A = await identity(a, "alice");
  const B = await identity(b, "bob");
  await friends(a, A, B);
  const r = await room(a, A.token, "private");
  const alice = await a.newPage();
  const bob = await b.newPage();
  await enter(alice, "alice");
  await enter(bob, "bob");
  const two = await b.newPage();
  await bob.goto(
    "/contacts/requests?kind=invitations&direction=received&status=pending",
  );
  await two.goto("/contacts/requests?kind=invitations");
  await alice.goto(`/contacts/${B.id}`);
  await alice.getByRole("button", { name: "邀请到房间", exact: true }).click();
  const dialog = alice.getByRole("dialog", { name: "邀请好友加入聊天室" });
  await dialog
    .getByRole("searchbox", { name: "搜索可邀请聊天室" })
    .fill(r.roomId);
  await dialog.getByRole("button", { name: new RegExp(r.name) }).click();
  await dialog
    .getByRole("textbox", { name: "邀请留言" })
    .fill("私有群真实邀请");
  await dialog.getByRole("button", { name: "发送邀请", exact: true }).click();
  await expect(dialog.getByRole("status")).toContainText("邀请已发送");
  await expect(bob.getByText("私有群真实邀请")).toBeVisible();
  await expect(two.getByText("私有群真实邀请")).toBeVisible();
  await bob.getByRole("button", { name: "接受邀请", exact: true }).click();
  await expect(bob.getByText("已加入聊天室", { exact: true })).toBeVisible();
  await expect(two.getByText("暂无群邀请")).toBeVisible();
  await bob.getByRole("button", { name: "进入聊天室", exact: true }).click();
  await expect(bob).toHaveURL(new RegExp(`/rooms/${r.roomId}$`));
  await bob.reload();
  await expect(
    bob.getByRole("button", { name: "房间邀请管理", exact: true }),
  ).toBeVisible();
  const list = await b.request.get(`${base}/users/me/chatrooms`, {
    headers: { Authorization: `Bearer ${B.token}` },
  });
  expect(JSON.stringify((await list.json()).data)).toContain(r.roomId);
  await a.close();
  await b.close();
});
test("home, room, member and avatar entries, sent cancellation, reject and capability recovery", async ({
  browser,
}) => {
  const a = await browser.newContext();
  const b = await browser.newContext();
  const A = await identity(a, "alice");
  const B = await identity(b, "bob");
  await friends(a, A, B);
  const r = await room(a, A.token, "protected");
  const page = await a.newPage();
  await enter(page, "alice");
  await page.getByRole("button", { name: "首页邀请好友", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "邀请好友加入聊天室" });
  await dialog
    .getByRole("searchbox", { name: "搜索可邀请聊天室" })
    .fill(r.roomId);
  await dialog.getByRole("button", { name: new RegExp(r.name) }).click();
  await dialog.getByRole("searchbox", { name: "搜索邀请好友" }).fill(B.id);
  await dialog.getByRole("button", { name: "选择", exact: true }).click();
  await dialog.getByRole("button", { name: "发送邀请", exact: true }).click();
  await expect(dialog.getByRole("status")).toContainText("邀请已发送");
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await page.goto("/contacts/requests?kind=invitations&direction=sent");
  const card = page.locator("article").filter({ hasText: r.name });
  await card.getByRole("button", { name: "取消邀请", exact: true }).click();
  await expect(card).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("tab", { name: /群邀请/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  // Another fresh room tests the preselected room entry and rejection.
  const s = await room(a, A.token, "public");
  await page.goto(`/rooms/${s.roomId}`);
  await page.getByRole("button", { name: "房间邀请管理", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "房间邀请管理" }),
  ).toBeVisible();
  await page
    .getByRole("dialog", { name: "房间邀请管理" })
    .getByRole("button", { name: "Close", exact: true })
    .click();
  const sent = await a.request.post(
    `${base}/chatroom/${s.roomId}/invitations`,
    {
      headers: { Authorization: `Bearer ${A.token}` },
      data: { inviteeId: B.id, message: "reject this" },
    },
  );
  const i = (await sent.json()).data.invitation.invitationId;
  const bob = await b.newPage();
  await enter(bob, "bob");
  await bob.goto("/contacts/requests?kind=invitations");
  await bob
    .locator(`[data-testid="invitation-${i}"]`)
    .getByRole("button", { name: "拒绝邀请", exact: true })
    .click();
  await expect(bob.getByText("reject this")).toHaveCount(0);
  await bob.goto("/contacts/requests?kind=invitations&status=rejected");
  await expect(bob.getByText("reject this")).toBeVisible();
  await a.close();
  await b.close();
});

test("room menu, member, message avatar and public profile use the shared invitation modal", async ({
  browser,
}) => {
  const ctx = await browser.newContext();
  const A = await identity(ctx, "alice"),
    B = await identity(ctx, "bob");
  await friends(ctx, A, B);
  const r = await room(ctx, A.token, "public");
  await ctx.request.post(`${base}/chatroom/joinroom`, {
    headers: { Authorization: `Bearer ${B.token}` },
    data: { roomId: r.roomId },
  });
  const page = await ctx.newPage();
  await enter(page, "alice");
  await page.goto(`/rooms/${r.roomId}`);
  await page.getByText("bob", { exact: true }).click();
  await page
    .getByTestId("context-menu")
    .getByRole("button", { name: "邀请好友", exact: true })
    .click();
  let dialog = page.getByRole("dialog", { name: "邀请好友加入聊天室" });
  await expect(
    dialog.getByRole("searchbox", { name: "搜索可邀请聊天室" }),
  ).toBeVisible();
  await dialog
    .getByRole("searchbox", { name: "搜索可邀请聊天室" })
    .fill(r.roomId);
  await expect(
    dialog.getByRole("button", { name: new RegExp(r.name) }),
  ).toHaveCount(0);
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  const sent = await ctx.request.post(`${base}/chatroom/${r.roomId}/messages`, {
    headers: { Authorization: `Bearer ${B.token}` },
    data: { type: "text", text: "invite-avatar-entry" },
  });
  const id = (await sent.json()).data.messageId;
  await page
    .locator(`[data-message-id="${id}"]`)
    .getByRole("img", { name: "bob" })
    .click();
  await page
    .getByTestId("context-menu")
    .getByRole("button", { name: "邀请好友", exact: true })
    .click();
  dialog = page.getByRole("dialog", { name: "邀请好友加入聊天室" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByTitle("邀请好友", { exact: true }).click();
  dialog = page.getByRole("dialog", { name: "邀请好友加入聊天室" });
  await expect(
    dialog.getByRole("searchbox", { name: "搜索邀请好友" }),
  ).toBeVisible();
  await expect(dialog.getByText("已加入", { exact: false })).toBeVisible();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await page.goto(`/user/${B.id}`);
  await page
    .locator("main")
    .getByRole("button", { name: "邀请到房间", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "邀请好友加入聊天室" }),
  ).toBeVisible();
  await ctx.close();
});
