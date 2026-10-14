import { describe, expect, it } from "vitest";
import { directUUID, mergeDirectMessages } from "./direct";
import type { DirectMessage } from "../types/direct";
function message(
  id: string,
  seq: string,
  revision: string,
  deleted = false,
): DirectMessage {
  return {
    messageId: id,
    roomId: "100000000",
    conversationKind: "direct",
    clientMessageId: id,
    directSeq: seq,
    revision,
    userId: "U100000000",
    sender: {
      userId: "U100000000",
      nickname: "Alice",
      avatar: "",
      signature: "",
      onlineStatus: null,
      availability: "active",
    },
    type: "text",
    text: deleted ? "" : "same",
    time: "",
    quotedMessageId: null,
    quote: null,
    editedAt: null,
    deletedAt: deleted ? "" : null,
    isDeleted: deleted,
  };
}
describe("direct message reconciliation", () => {
  it("does not resurrect withdrawal from delayed history and handles large sequence strings", () => {
    const deleted = message("a", "9007199254740993", "20", true);
    const old = message("a", "9007199254740993", "1");
    const result = mergeDirectMessages(
      [deleted],
      [old, message("b", "9007199254740994", "21")],
    );
    expect(result[0].isDeleted).toBe(true);
    expect(result[0].text).toBe("");
    expect(result.map((m) => m.messageId)).toEqual(["a", "b"]);
  });
  it("preserves identical text with different identities but deduplicates ACK and broadcast", () => {
    const first = message("a", "1", "1");
    const second = message("b", "2", "2");
    expect(mergeDirectMessages([first], [first, second])).toHaveLength(2);
  });
  it("creates standard random UUIDs", () => {
    expect(directUUID()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});
