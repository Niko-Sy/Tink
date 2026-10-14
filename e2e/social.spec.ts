import { test, expect } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";
const backend = "http://127.0.0.1:18080/api/v1";
async function credentials(context: BrowserContext, username: string) {
  const response = await context.request.post(`${backend}/auth/login`, {
    data: { username, password: "Testpass123!" },
  });
  expect(response.ok()).toBeTruthy();
  const result = await response.json();
  return {
    token: result.data.token as string,
    userId: result.data.user.userId as string,
  };
}
async function loginUI(page: Page, username: string) {
  await page.goto("/login");
  await page.getByPlaceholder("请输入账号").fill(username);
  await page
    .getByPlaceholder("请输入密码", { exact: true })
    .fill("Testpass123!");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL(/11451\/$/);
  await page.goto("/contacts");
  await expect(
    page.getByRole("heading", { name: "通讯录", exact: true }),
  ).toBeVisible();
}
test("real friend lifecycle, multi-tab events, group separation and refresh", async ({
  browser,
}) => {
  const a = await browser.newContext();
  const b = await browser.newContext();
  const alice = await a.newPage();
  const bob = await b.newPage();
  const A = await credentials(a, "alice");
  const B = await credentials(b, "bob");
  await a.request.delete(`${backend}/friends/${B.userId}`, {
    headers: { Authorization: `Bearer ${A.token}` },
  });
  await loginUI(alice, "alice");
  await loginUI(bob, "bob");
  const bobTwo = await b.newPage();
  await bobTwo.goto("/contacts/requests");
  await bob.goto("/contacts/requests");
  await alice.getByRole("button", { name: "添加好友", exact: true }).click();
  await alice.getByRole("searchbox", { name: "查找用户" }).fill(B.userId);
  await alice.getByRole("button", { name: "查找", exact: true }).click();
  await alice.getByRole("textbox", { name: "申请留言" }).fill("一起聊天");
  await alice.getByRole("button", { name: "发送申请", exact: true }).click();
  await expect(alice.getByRole("status")).toContainText("申请已发送");
  await expect(
    bob.getByRole("button", { name: "接受", exact: true }),
  ).toBeVisible();
  await expect(
    bobTwo.getByRole("button", { name: "接受", exact: true }),
  ).toBeVisible();
  await bob.getByRole("button", { name: "接受", exact: true }).click();
  await expect(bobTwo.getByText("暂无申请")).toBeVisible();
  await alice.getByRole("button", { name: "查看联系人", exact: true }).click();
  await expect(
    alice.getByRole("heading", { name: "联系人详情" }),
  ).toBeVisible();
  await alice.reload();
  await expect(
    alice.getByRole("heading", { name: "联系人详情" }),
  ).toBeVisible();
  await expect(
    alice.locator("section").getByRole("button", { name: "私信", exact: true }),
  ).toBeEnabled();
  await bob.close();
  await bobTwo.goto("/contacts");
  await expect(bobTwo.getByTestId(`contact-${A.userId}`)).toBeVisible();
  const recovery = await b.request.post(`${backend}/auth/register`, {
    data: {
      username: "recovery_user",
      password: "Testpass123!",
      nickname: "Recovery",
      email: "recovery@example.test",
    },
  });
  expect(recovery.ok()).toBeTruthy();
  const D = await credentials(b, "recovery_user");
  await bobTwo.evaluate(async () => {
    const client = (
      await import(/* @vite-ignore */ "/src/services/websocket.ts")
    ).wsClient;
    (client as unknown as { ws: WebSocket }).ws.close();
  });
  const recoveryRequest = await b.request.post(`${backend}/friends/requests`, {
    headers: { Authorization: `Bearer ${B.token}` },
    data: { toUserId: D.userId },
  });
  const recoveryId = (await recoveryRequest.json()).data.request.requestId;
  await b.request.post(`${backend}/friends/requests/${recoveryId}/accept`, {
    headers: { Authorization: `Bearer ${D.token}` },
    data: {},
  });
  await expect(bobTwo.getByTestId(`contact-${D.userId}`)).toBeVisible({
    timeout: 10000,
  });
  await b.request.delete(`${backend}/friends/${D.userId}`, {
    headers: { Authorization: `Bearer ${B.token}` },
  });

  const rooms = await a.request.get(`${backend}/users/me/chatrooms`, {
    headers: { Authorization: `Bearer ${A.token}` },
  });
  const roomData = await rooms.json();
  const room = (roomData.data.list ?? roomData.data.chatrooms)[0];
  await alice.goto(`/rooms/${room.roomId}`);
  await alice.getByTitle("通讯录", { exact: true }).click();
  await expect(alice.getByTestId(`contact-${B.userId}`)).toBeVisible();
  await alice.getByTestId(`contact-${B.userId}`).click();
  await alice.getByRole("button", { name: "删除好友", exact: true }).click();
  await alice.getByRole("button", { name: "确认删除", exact: true }).click();
  await expect(alice).toHaveURL(/\/contacts$/);
  await expect(bobTwo.getByTestId(`contact-${A.userId}`)).toHaveCount(0);
  await a.close();
  await b.close();
});
test("reject, cancel, errors, public profile and account isolation", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const A = await credentials(context, "alice");
  const C = await credentials(context, "carol");
  await loginUI(page, "alice");
  await page.goto(`/user/${C.userId}`);
  await expect(page.getByRole("heading", { name: "用户资料" })).toBeVisible();
  await expect(page.getByText("carol", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "添加好友", exact: true }).click();
  await page.getByRole("button", { name: "发送申请", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("申请已发送");
  await page.keyboard.press("Escape");
  await page.goto("/contacts/requests");
  await page.getByRole("tab", { name: "发出的申请" }).click();
  await page.getByRole("button", { name: "取消申请", exact: true }).click();
  await expect(page.getByText("暂无申请")).toBeVisible();
  const r = await context.request.post(`${backend}/friends/requests`, {
    headers: { Authorization: `Bearer ${C.token}` },
    data: { toUserId: (await credentials(context, "bob")).userId },
  });
  expect(r.status()).toBe(201);
  const id = (await r.json()).data.request.requestId;
  const B = await credentials(context, "bob");
  const reject = await context.request.post(
    `${backend}/friends/requests/${id}/reject`,
    { headers: { Authorization: `Bearer ${B.token}` }, data: {} },
  );
  expect(reject.ok()).toBeTruthy();
  const unauthorized = await context.request.post(
    `${backend}/friends/requests/${id}/accept`,
    { headers: { Authorization: `Bearer ${A.token}` }, data: {} },
  );
  expect(unauthorized.status()).toBe(404);
  await page.goto("/contacts");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "通讯录", exact: true }),
  ).toBeVisible();
  await context.close();
});

test("logout clears contact caches, hidden status stays private, and errors preserve the form", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const A = await credentials(context, "alice");
  const H = await credentials(context, "hidden");
  const sent = await context.request.post(`${backend}/friends/requests`, {
    headers: { Authorization: `Bearer ${A.token}` },
    data: { toUserId: H.userId },
  });
  expect(sent.status()).toBe(201);
  const id = (await sent.json()).data.request.requestId;
  await context.request.post(`${backend}/friends/requests/${id}/accept`, {
    headers: { Authorization: `Bearer ${H.token}` },
    data: {},
  });
  await loginUI(page, "alice");
  await expect(page.getByTestId(`contact-${H.userId}`)).toContainText(
    "状态未公开",
  );
  await page.getByRole("button", { name: "添加好友", exact: true }).click();
  await page.getByRole("searchbox", { name: "查找用户" }).fill("invalid");
  await page.getByRole("button", { name: "查找", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "查找用户" })).toHaveValue(
    "invalid",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("img", { name: "User Avatar", exact: true }).click();
  await page.getByRole("button", { name: "退出登录", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await loginUI(page, "bob");
  await expect(page.getByTestId(`contact-${H.userId}`)).toHaveCount(0);
  await expect(page.getByText(/bob的通讯录/)).toBeVisible();
  await context.close();
});
