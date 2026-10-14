import { useEffect, useState } from "react";
import { friendService } from "../services/friend";
import type { PaginatedResponse } from "../services/api";
import type { FriendContact, FriendRequest } from "../types/social";
import { socialError, useSocial } from "./useSocial";
const empty = <T>(): PaginatedResponse<T> => ({
  list: [],
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 0,
});
export function useFriends(q: string, status: string, page: number) {
  const { revision, capabilities } = useSocial();
  const [data, setData] = useState(empty<FriendContact>);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!capabilities?.friends) return;
    let alive = true;
    const timer = window.setTimeout(
      () => {
        setLoading(true);
        void friendService
          .friends({ q, status, page, pageSize: 20 })
          .then((r) => {
            if (alive) {
              setData(r.data);
              setError(null);
            }
          })
          .catch((e) => {
            if (alive) setError(socialError(e));
          })
          .finally(() => {
            if (alive) setLoading(false);
          });
      },
      q ? 300 : 0,
    );
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [revision, capabilities?.friends, q, status, page]);
  return { data, loading, error };
}
export function useFriendRequests(
  direction: "received" | "sent",
  status: string,
  page: number,
) {
  const { revision, capabilities } = useSocial();
  const [data, setData] = useState(empty<FriendRequest>);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!capabilities?.friends) return;
    let alive = true;
    const load = () => {
      setLoading(true);
      void friendService
        .requests({ direction, status, page, pageSize: 20 })
        .then((r) => {
          if (alive) {
            setData(r.data);
            setError(null);
          }
        })
        .catch((e) => {
          if (alive) setError(socialError(e));
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    };
    load();
    return () => {
      alive = false;
    };
  }, [revision, capabilities?.friends, direction, status, page]);
  const apply = (request: FriendRequest) =>
    setData((previous) => {
      const keep = !status || request.status === status;
      const list = previous.list.flatMap((item) =>
        item.requestId !== request.requestId ? [item] : keep ? [request] : [],
      );
      const removed = previous.list.length - list.length;
      return { ...previous, list, total: previous.total - removed };
    });
  return { data, loading, error, apply };
}
