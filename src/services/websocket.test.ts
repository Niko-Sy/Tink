import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("./api", () => ({
  config: { wsURL: "ws://localhost/ws" },
  tokenManager: { getToken: () => "test", isTokenExpired: () => false },
  apiRequest: {
    post: vi.fn(async () => ({ data: { ticket: "single-use-test-ticket" } })),
  },
  refreshAccessToken: vi.fn(),
  tokenActor: () => "test",
}));
import { WebSocketClient } from "./websocket";
class FakeSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  readyState = 0;
  onopen: (() => void) | null = null;
  onclose: ((event: { code: number; reason: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  constructor() {
    instances.push(this);
  }
  close() {
    this.readyState = 3;
    this.onclose?.({ code: 1000, reason: "" });
  }
  send() {}
}
const instances: FakeSocket[] = [];
beforeEach(() => {
  instances.length = 0;
  vi.stubGlobal("WebSocket", FakeSocket);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe("WebSocket connection lifecycle", () => {
  it("does not open two connections while the first is still connecting", async () => {
    const client = new WebSocketClient();
    client.connect("test");
    client.connect("test");
    await Promise.resolve();
    expect(instances).toHaveLength(1);
    client.disconnect();
  });
  it("ignores a delayed close event from an earlier connection", async () => {
    const client = new WebSocketClient();
    client.connect("test");
    await Promise.resolve();
    const previous = instances[0];
    client.disconnect();
    client.connect("test");
    await Promise.resolve();
    const current = instances[1];
    current.readyState = FakeSocket.OPEN;
    current.onopen?.();
    expect(client.isConnected).toBe(true);
    previous.onclose?.({ code: 1006, reason: "late" });
    expect(client.isConnected).toBe(true);
    client.disconnect();
  });
});

describe("direct acknowledgements", () => {
  it("rejects a correlated business error without requesting transport fallback", async () => {
    const client = new WebSocketClient();
    client.connect("test");
    await Promise.resolve();
    const socket = instances[0];
    socket.readyState = FakeSocket.OPEN;
    socket.onopen?.();
    const promise = client.sendDirectMessage("100000000", {
      type: "text",
      text: "test",
      clientMessageId: "key",
    });
    socket.onmessage?.({
      data: JSON.stringify({
        type: "error",
        action: "send_failed",
        data: {
          roomId: "100000000",
          clientMessageId: "key",
          businessCode: "DIRECT_READ_ONLY",
          message: "readonly",
        },
      }),
    });
    await expect(promise).rejects.toEqual({
      businessCode: "DIRECT_READ_ONLY",
      message: "readonly",
      details: undefined,
    });
    client.disconnect();
  });
  it("uses an uncertainty error when the five-second ACK deadline expires", async () => {
    vi.useFakeTimers();
    const client = new WebSocketClient();
    client.connect("test");
    await Promise.resolve();
    const socket = instances[0];
    socket.readyState = FakeSocket.OPEN;
    socket.onopen?.();
    const promise = client.sendDirectMessage("100000000", {
      type: "text",
      text: "test",
      clientMessageId: "key",
    });
    const assertion = expect(promise).rejects.toMatchObject({
      transportUnknown: true,
    });
    await vi.advanceTimersByTimeAsync(5000);
    await assertion;
    client.disconnect();
  });
});
