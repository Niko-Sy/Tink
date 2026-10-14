import { useCallback, useEffect, useRef, useState } from "react";
import { useDirect } from "./useDirect";
import { directService } from "../services/direct";
import { socialError } from "./useSocial";
import { wsClient } from "../services/websocket";
export function useDirectMessages(room: string) {
  const { messages, merge, getCursor, setCursor } = useDirect();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [older, setOlder] = useState("");
  const [oldestVisible, setOldestVisible] = useState("0");
  const busy = useRef(false);
  const dirty = useRef(false);
  const alive = useRef(false);
  const initialized = useRef(false);
  const synchronize = useCallback(async () => {
    if (!alive.current || !initialized.current) return;
    if (busy.current) {
      dirty.current = true;
      return;
    }
    busy.current = true;
    try {
      do {
        dirty.current = false;
        let again = true;
        while (again && alive.current) {
          const response = await directService.changes(
            room,
            getCursor(room) ?? "0",
          );
          if (!alive.current) return;
          merge(
            room,
            response.data.changes.map((c) => c.message),
          );
          setCursor(room, response.data.nextCursor);
          again = response.data.hasMore;
        }
      } while (dirty.current && alive.current);
      if (alive.current) setError(null);
    } catch (e) {
      if (alive.current) setError(socialError(e));
    } finally {
      busy.current = false;
    }
  }, [room, getCursor, setCursor, merge]);
  useEffect(() => {
    alive.current = true;
    initialized.current = false;
    let current = true;
    const load = async () => {
      try {
        const snapshot = await directService.history(room);
        if (!alive.current || !current) return;
        merge(room, snapshot.data.messages);
        setOldestVisible(snapshot.data.messages[0]?.directSeq ?? "0");
        setMore(snapshot.data.hasMore);
        setOlder(snapshot.data.nextCursor);
        if (getCursor(room) === undefined)
          setCursor(room, snapshot.data.changeRevision);
        initialized.current = true;
        await synchronize();
      } catch (e) {
        if (alive.current && current) setError(socialError(e));
      } finally {
        if (alive.current && current) setLoading(false);
      }
    };
    void load();
    return () => {
      current = false;
      alive.current = false;
    };
  }, [room, merge, getCursor, setCursor, synchronize]);
  useEffect(() => {
    const event = (value: {
      data?: { roomId?: string; conversationKind?: string };
    }) => {
      if (
        value.data?.roomId === room &&
        value.data.conversationKind === "direct"
      )
        void synchronize();
    };
    const connected = () => void synchronize();
    const visible = () => {
      if (!document.hidden) void synchronize();
    };
    wsClient.on("message", event);
    wsClient.on("connected", connected);
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("focus", visible);
    const timer = window.setInterval(() => {
      if (!document.hidden && !wsClient.isConnected) void synchronize();
    }, 5000);
    return () => {
      wsClient.off("message", event);
      wsClient.off("connected", connected);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("focus", visible);
      window.clearInterval(timer);
    };
  }, [room, synchronize]);
  const loadMore = async () => {
    if (!more) return;
    try {
      const response = await directService.history(room, older);
      if (!alive.current) return;
      merge(room, response.data.messages);
      if (response.data.messages.length)
        setOldestVisible(response.data.messages[0].directSeq);
      setMore(response.data.hasMore);
      setOlder(response.data.nextCursor);
    } catch (e) {
      if (alive.current) setError(socialError(e));
    }
  };
  return {
    messages: (messages[room] ?? []).filter(
      (m) => BigInt(m.directSeq) >= BigInt(oldestVisible),
    ),
    loading,
    error,
    more,
    loadMore,
    synchronize,
  };
}
