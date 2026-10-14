import { test, expect } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";
const api = "http://127.0.0.1:18080/api/v1";
async function auth(context: BrowserContext, username: string) {
  const r = await context.request.post(`${api}/auth/login`, {
    data: { username, password: "Testpass123!" },
  });
  const result = await r.json();
  return {
    id: result.data.user.userId as string,
    token: result.data.token as string,
  };
}
async function signIn(page: Page, username: string) {
  await page.goto("/login");
  await page.getByPlaceholder("请输入账号").fill(username);
  await page
    .getByPlaceholder("请输入密码", { exact: true })
    .fill("Testpass123!");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL(/11451\/$/);
}
async function friends(
  context: BrowserContext,
  a: { id: string; token: string },
  b: { id: string; token: string },
) {
  const headers = { Authorization: `Bearer ${a.token}` };
  const rel = await context.request.get(`${api}/users/${b.id}/relationship`, {
    headers,
  });
  if ((await rel.json()).data.state === "friends") return;
  const r = await context.request.post(`${api}/friends/requests`, {
    headers,
    data: { toUserId: b.id },
  });
  const body = await r.json();
  expect(r.ok()).toBeTruthy();
  const accepted = await context.request.post(
    `${api}/friends/requests/${body.data.request.requestId}/accept`,
    { headers: { Authorization: `Bearer ${b.token}` }, data: {} },
  );
  expect(accepted.ok()).toBeTruthy();
}
test("private entry, WS, reply, edit, withdrawal and cross-user isolation", async ({
  browser,
}) => {
  const a = await browser.newContext();
  const b = await browser.newContext();
  const c = await browser.newContext();
  const A = await auth(a, "alice");
  const B = await auth(b, "bob");
  await friends(a, A, B);
  const alice = await a.newPage();
  const bob = await b.newPage();
  const carol = await c.newPage();
  await signIn(alice, "alice");
  await signIn(bob, "bob");
  await signIn(carol, "carol");
  await alice.goto(`/contacts/${B.id}`);
  await alice
    .locator("section")
    .getByRole("button", { name: "私信", exact: true })
    .click();
  await expect(alice).toHaveURL(/\/direct\/\d{9}$/);
  const room = alice.url().split("/").pop()!;
  await bob.goto("/direct");
  await bob.getByTestId(`direct-${room}`).last().click();
  await expect(bob.getByRole("region", { name: "私信会话" })).toBeVisible();
  await alice.bringToFront();
  await alice.getByRole("textbox", { name: "私信内容" }).fill("第一条私信");
  await alice.getByRole("button", { name: "发送私信" }).click();
  await expect(
    bob.getByTestId("direct-timeline").getByText("第一条私信", { exact: true }),
  ).toBeVisible();
  await expect(
    alice
      .getByTestId("direct-timeline")
      .getByText("第一条私信", { exact: true }),
  ).toHaveCount(1);
  await bob.bringToFront();
  await bob.getByRole("button", { name: "回复", exact: true }).click();
  await bob.getByRole("textbox", { name: "私信内容" }).fill("引用回复");
  await bob.getByRole("button", { name: "发送私信" }).click();
  await expect(
    alice.getByTestId("direct-timeline").getByText("引用回复", { exact: true }),
  ).toBeVisible();
  await alice.bringToFront();
  await alice.getByRole("button", { name: "编辑", exact: true }).click();
  await alice
    .getByRole("textbox", { name: "编辑消息内容" })
    .fill("修改后的私信");
  await alice.getByRole("button", { name: "保存", exact: true }).click();
  await expect(
    bob
      .getByTestId("direct-timeline")
      .getByText("修改后的私信", { exact: true }),
  ).toBeVisible();
  await alice.getByRole("button", { name: "撤回", exact: true }).click();
  await expect(
    bob
      .getByTestId("direct-timeline")
      .getByText("消息已撤回", { exact: true })
      .first(),
  ).toBeVisible();
  await bob.reload();
  await expect(
    bob
      .getByTestId("direct-timeline")
      .getByText("消息已撤回", { exact: true })
      .first(),
  ).toBeVisible();
  await carol.goto(`/direct/${room}`);
  await expect(carol.getByRole("alert")).toContainText("会话不可访问");
  await expect(carol.getByRole("textbox", { name: "私信内容" })).toHaveCount(0);
  const removed = await a.request.delete(`${api}/friends/${B.id}`, {
    headers: { Authorization: `Bearer ${A.token}` },
  });
  expect(removed.ok()).toBeTruthy();
  await expect(
    alice.getByRole("alert").filter({ hasText: "已解除好友关系" }),
  ).toBeVisible();
  await expect(bob.getByRole("textbox", { name: "私信内容" })).toBeDisabled();
  await friends(a, A, B);
  await expect(alice.getByRole("textbox", { name: "私信内容" })).toBeEnabled();
  const same = await a.request.post(`${api}/direct-conversations`, {
    headers: { Authorization: `Bearer ${A.token}` },
    data: { peerUserId: B.id },
  });
  expect((await same.json()).data.conversation.roomId).toBe(room);
  await a.close();
  await b.close();
  await c.close();
});
test("HTTP fallback and offline old-message changes recover with persisted unread", async ({
  browser,
}) => {
  const a = await browser.newContext();
  const b = await browser.newContext();
  const A = await auth(a, "alice");
  const B = await auth(b, "bob");
  await friends(a, A, B);
  const roomResponse = await a.request.post(`${api}/direct-conversations`, {
    headers: { Authorization: `Bearer ${A.token}` },
    data: { peerUserId: B.id },
  });
  const room = (await roomResponse.json()).data.conversation.roomId as string;
  const alice = await a.newPage();
  const bob = await b.newPage();
  await signIn(alice, "alice");
  await signIn(bob, "bob");
  await alice.goto(`/direct/${room}`);
  await bob.goto(`/direct/${room}`);
  await alice.bringToFront();
  await alice.evaluate(async () =>
    (
      await import(/* @vite-ignore */ "/src/services/websocket.ts")
    ).wsClient.disconnect(),
  );
  await alice.getByRole("textbox", { name: "私信内容" }).fill("HTTP回退消息");
  await alice.getByRole("button", { name: "发送私信" }).click();
  await expect(
    bob
      .getByTestId("direct-timeline")
      .getByText("HTTP回退消息", { exact: true }),
  ).toBeVisible();
  const history = await a.request.get(
    `${api}/direct-conversations/${room}/messages`,
    { headers: { Authorization: `Bearer ${A.token}` } },
  );
  const message = (await history.json()).data.messages.find(
    (m: { text: string }) => m.text === "HTTP回退消息",
  );
  await bob.evaluate(async () =>
    (
      await import(/* @vite-ignore */ "/src/services/websocket.ts")
    ).wsClient.disconnect(),
  );
  await a.request.post(
    `${api}/direct-conversations/${room}/messages/${message.messageId}/edit`,
    {
      headers: { Authorization: `Bearer ${A.token}` },
      data: { text: "离线期间修改", expectedRevision: message.revision },
    },
  );
  await bob.evaluate(async () =>
    (
      await import(/* @vite-ignore */ "/src/services/websocket.ts")
    ).wsClient.connect(),
  );
  await expect(
    bob
      .getByTestId("direct-timeline")
      .getByText("离线期间修改", { exact: true }),
  ).toBeVisible();
  await a.request.post(
    `${api}/direct-conversations/${room}/messages/${message.messageId}/delete`,
    { headers: { Authorization: `Bearer ${A.token}` }, data: {} },
  );
  await expect(
    bob
      .getByTestId("direct-timeline")
      .getByText("离线期间修改", { exact: true }),
  ).toHaveCount(0);
  await bob.bringToFront();
  await bob.reload();
  await expect(bob.getByRole("region", { name: "私信会话" })).toBeVisible();
  await expect
    .poll(
      async () =>
        (
          await (
            await b.request.get(`${api}/direct-conversations/${room}`, {
              headers: { Authorization: `Bearer ${B.token}` },
            })
          ).json()
        ).data.unreadCount,
    )
    .toBe(0);
  await a.close();
  await b.close();
});

test('public profile, member and message-avatar entries reuse the same conversation', async ({ browser }) => {
 const context = await browser.newContext(); const A = await auth(context, 'alice'); const B = await auth(context, 'bob'); await friends(context, A, B);
 const created = await context.request.post(`${api}/direct-conversations`, { headers: { Authorization: `Bearer ${A.token}` }, data: { peerUserId: B.id } }); const room = (await created.json()).data.conversation.roomId as string;
 const page = await context.newPage(); await signIn(page, 'alice'); await page.goto(`/user/${B.id}`); await page.locator('main').getByRole('button', { name: '私信', exact: true }).click(); await expect(page).toHaveURL(new RegExp(`/direct/${room}$`));
 const groups = await context.request.get(`${api}/users/me/chatrooms`, { headers: { Authorization: `Bearer ${A.token}` } }); const group = (await groups.json()).data.chatrooms.find((r: { type: string }) => r.type === 'public');
 await context.request.post(`${api}/chatroom/joinroom`, { headers: { Authorization: `Bearer ${B.token}` }, data: { roomId: group.roomId } });
 await page.goto(`/rooms/${group.roomId}`); await page.getByText('bob', { exact: true }).click(); await page.getByTestId('context-menu').getByRole('button', { name: '私信', exact: true }).click(); await expect(page).toHaveURL(new RegExp(`/direct/${room}$`));
 const sent = await context.request.post(`${api}/chatroom/${group.roomId}/messages`, { headers: { Authorization: `Bearer ${B.token}` }, data: { type: 'text', text: '头像入口验证' } }); expect(sent.ok()).toBeTruthy(); const messageId = (await sent.json()).data.messageId as string;
 await page.goto(`/rooms/${group.roomId}`); await page.locator(`[data-message-id="${messageId}"]`).getByRole('img', { name: 'bob' }).click(); await page.getByTestId('context-menu').getByRole('button', { name: '私信', exact: true }).click(); await expect(page).toHaveURL(new RegExp(`/direct/${room}$`));
 await context.close();
});

test("old-history and background tabs preserve unread until messages are actually viewed", async ({ browser }) => {
  const a = await browser.newContext(); const b = await browser.newContext();
  for (const [context, username] of [[a, "reading_writer"], [b, "reading_viewer"]] as const) {
    const registered = await context.request.post(`${api}/auth/register`, { data: { username, password: "Testpass123!", nickname: username, email: `${username}@example.test`, avatar: "/Tink.svg" } }); expect(registered.ok()).toBeTruthy();
  }
  const A = await auth(a, "reading_writer"); const B = await auth(b, "reading_viewer"); await friends(a, A, B);
  const created = await a.request.post(`${api}/direct-conversations`, { headers: { Authorization: `Bearer ${A.token}` }, data: { peerUserId: B.id } }); const room = (await created.json()).data.conversation.roomId as string;
  const send = async (text: string) => { const r = await a.request.post(`${api}/direct-conversations/${room}/messages`, { headers: { Authorization: `Bearer ${A.token}` }, data: { type: "text", text, clientMessageId: crypto.randomUUID() } }); expect(r.ok()).toBeTruthy(); };
  const detail = async () => (await (await b.request.get(`${api}/direct-conversations/${room}`, { headers: { Authorization: `Bearer ${B.token}` } })).json()).data;
  for (let i = 0; i < 25; i++) await send(`历史消息 ${i}`);
  const reader = await b.newPage(); await signIn(reader, "reading_viewer"); await reader.goto(`/direct/${room}`); await reader.bringToFront(); await expect.poll(async () => (await detail()).unreadCount).toBe(0);
  await reader.getByTestId("direct-timeline").evaluate(node => { node.scrollTop = 0; });
  await expect.poll(async () => reader.getByTestId("direct-timeline").evaluate(node => node.scrollTop)).toBe(0);
  await send("浏览历史期间的新消息"); await expect.poll(async () => (await detail()).unreadCount).toBe(1);
  const background = await b.newPage(); await background.goto("/contacts"); await background.bringToFront(); await send("后台期间的新消息"); await expect.poll(async () => (await detail()).unreadCount).toBe(2);
  await reader.bringToFront(); await reader.getByTestId("direct-timeline").evaluate(node => { node.scrollTop = node.scrollHeight; }); await expect.poll(async () => (await detail()).unreadCount).toBe(0);
  const sender = await a.request.get(`${api}/direct-conversations/${room}`, { headers: { Authorization: `Bearer ${A.token}` } }); expect((await sender.json()).data.lastReadSeq).toBe("0");
  await a.close(); await b.close();
});

test("a committed write with a dropped ACK uses the original HTTP key exactly once", async ({ browser }) => {
  const context = await browser.newContext(); const A = await auth(context, "alice"); const B = await auth(context, "bob"); await friends(context, A, B);
  const created = await context.request.post(`${api}/direct-conversations`, { headers: { Authorization: `Bearer ${A.token}` }, data: { peerUserId: B.id } }); const room = (await created.json()).data.conversation.roomId as string;
  const page = await context.newPage(); await signIn(page, "alice"); await page.goto(`/direct/${room}`); await page.bringToFront();
  await page.evaluate(async () => {
    const client = (await import(/* @vite-ignore */ "/src/services/websocket.ts")).wsClient as unknown as { ws: WebSocket; isConnected: boolean };
    if (!client.isConnected) throw new Error("WebSocket not connected"); const socket = client.ws; const handler = socket.onmessage;
    socket.onmessage = event => { const packet = JSON.parse(event.data); if (packet.type === "message" && packet.action === "ack") return; handler?.call(socket, event); };
  });
  const recovered = page.waitForRequest(r => r.method() === "POST" && r.url().endsWith(`/direct-conversations/${room}/messages`));
  await page.getByRole("textbox", { name: "私信内容" }).fill("ACK丢失恢复"); await page.getByRole("button", { name: "发送私信" }).click(); const request = await recovered;
  await expect(page.getByRole("button", { name: "发送私信" })).toBeEnabled(); await expect(page.getByTestId("direct-timeline").getByText("ACK丢失恢复", { exact: true })).toHaveCount(1);
  const history = await context.request.get(`${api}/direct-conversations/${room}/messages`, { headers: { Authorization: `Bearer ${A.token}` } }); const messages = (await history.json()).data.messages as { clientMessageId: string }[];
  expect(messages.filter(m => m.clientMessageId === request.postDataJSON().clientMessageId)).toHaveLength(1);
  await context.close();
});
