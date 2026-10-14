import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification } from 'antd';
import { useAuth } from '../hooks/useAuth';
import { socialError, useSocial } from '../hooks/useSocial';
import { DirectContext } from './direct';
import { directService, mergeDirectMessages } from '../services/direct';
import { wsClient } from '../services/websocket';
import { tokenManager } from '../services/api';
import type { DirectConversation, DirectMessage, DirectSendInput, PendingDirect } from '../types/direct';
function sessionActor(): string | null { try { const token = tokenManager.getToken(); if (!token) return null; const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'); return (JSON.parse(atob(payload)) as { userId: string }).userId; } catch { return null; } }
export function DirectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth(); const social = useSocial(); const navigate = useNavigate();
  const socialRefresh = social.refresh; const openAddFriend = social.openAddFriend;
  const directEnabled = social.capabilities?.directMessages;
  const [items, setItems] = useState<DirectConversation[]>([]); const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const [revision, setRevision] = useState(0);
  const [messages, setMessages] = useState<Record<string, DirectMessage[]>>({}); const [pending, setPending] = useState<Record<string, PendingDirect[]>>({}); const [drafts, setDrafts] = useState<Record<string, string>>({});
  const cursors = useRef<Record<string, string>>({}); const listCursor = useRef(''); const alive = useRef(true); const pages = useRef(1); const loadingMore = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const refresh = useCallback(() => setRevision(v => v + 1), []);
  const merge = useCallback((room: string, incoming: DirectMessage[]) => {
    setMessages(old => ({ ...old, [room]: mergeDirectMessages(old[room] ?? [], incoming) }));
    setPending(old => ({ ...old, [room]: (old[room] ?? []).filter(p => !incoming.some(m => m.clientMessageId === p.input.clientMessageId && m.userId === user?.userId)) }));
  }, [user?.userId]);
  const setDraft = useCallback((room: string, text: string) => setDrafts(old => ({ ...old, [room]: text })), []);
  const getCursor = useCallback((room: string) => cursors.current[room], []);
  const setCursor = useCallback((room: string, cursor: string) => { if (BigInt(cursor) >= BigInt(cursors.current[room] ?? '0')) cursors.current[room] = cursor; }, []);
  useEffect(() => {
    if (!social.capabilities) return;
    let current = true;
    const load = async () => {
      try {
        let cursor = ''; const loaded: DirectConversation[] = []; let more = false;
        for (let page = 0; page < pages.current; page++) { const result = await directService.list(cursor); if (!current) return; loaded.push(...result.data.list); cursor = result.data.nextCursor; more = result.data.hasMore; if (!more) break; }
        setItems(loaded); listCursor.current = cursor; setHasMore(more); setError(null);
      } catch (e) { if (current) setError(socialError(e)); }
      finally { if (current) setLoading(false); }
    };
    void load(); return () => { current = false; };
  }, [revision, social.revision, social.capabilities]);
  useEffect(() => {
    const message = (event: { action?: string; data?: DirectMessage }) => { if (event.data?.conversationKind === 'direct') { merge(event.data.roomId, [event.data]); refresh(); socialRefresh(); } };
    const read = () => { refresh(); socialRefresh(); };
    wsClient.on('message', message); wsClient.on('direct', read); wsClient.on('connected', read);
    const visible = () => { if (!document.hidden) refresh(); }; window.addEventListener('focus', visible); document.addEventListener('visibilitychange', visible);
    const timer = window.setInterval(() => { if (!document.hidden && !wsClient.isConnected) refresh(); }, 30000);
    return () => { wsClient.off('message', message); wsClient.off('direct', read); wsClient.off('connected', read); window.removeEventListener('focus', visible); document.removeEventListener('visibilitychange', visible); window.clearInterval(timer); };
  }, [merge, refresh, socialRefresh]);
  const loadMore = useCallback(async () => {
    if (loadingMore.current || !hasMore) return; loadingMore.current = true;
    try { const response = await directService.list(listCursor.current); if (!alive.current) return; setItems(old => [...new Map([...old, ...response.data.list].map(r => [r.roomId, r])).values()]); pages.current++; listCursor.current = response.data.nextCursor; setHasMore(response.data.hasMore); }
    catch (e) { if (alive.current) setError(socialError(e)); } finally { loadingMore.current = false; }
  }, [hasMore]);
  const start = useCallback(async (peerUserId: string) => {
    if (!directEnabled || sessionActor() !== user?.userId) return;
    try { const response = await directService.create(peerUserId); if (!alive.current) return; refresh(); navigate(`/direct/${response.data.conversation.roomId}`); }
    catch (e) { if (!alive.current) return; if (typeof e === 'object' && e && 'businessCode' in e && e.businessCode === 'DIRECT_REQUIRES_FRIENDSHIP') openAddFriend(peerUserId); else notification.error({ message: '无法打开私信', description: socialError(e) }); }
  }, [navigate, refresh, directEnabled, openAddFriend, user?.userId]);
  const send = useCallback(async (room: string, input: DirectSendInput) => {
    if (sessionActor() !== user?.userId) throw { businessCode: "USER_SESSION_CHANGED", message: "登录会话已变化" };
    setPending(old => ({ ...old, [room]: [...(old[room] ?? []).filter(p => p.input.clientMessageId !== input.clientMessageId), { input, state: 'sending' }] }));
    try {
      let sent: DirectMessage;
      try { sent = await wsClient.sendDirectMessage(room, input); }
      catch (e) { if (!alive.current) return; if (typeof e === 'object' && e && 'transportUnknown' in e && sessionActor() === user?.userId) sent = (await directService.send(room, input)).data; else throw e; }
      if (!alive.current) return; merge(room, [sent]); refresh();
    } catch (e) { if (!alive.current) return; setPending(old => ({ ...old, [room]: (old[room] ?? []).map(p => p.input.clientMessageId === input.clientMessageId ? { ...p, state: 'failed', error: socialError(e) } : p) })); refresh(); throw e; }
  }, [merge, refresh, user?.userId]);
  const value = useMemo(() => ({ items, loading, error, hasMore, revision, messages, pending, drafts, refresh, loadMore, start, merge, send, setDraft, getCursor, setCursor }), [items, loading, error, hasMore, revision, messages, pending, drafts, refresh, loadMore, start, merge, send, setDraft, getCursor, setCursor]);
  if (!user) return <>{children}</>;
  return <DirectContext.Provider value={value}>{children}</DirectContext.Provider>;
}
