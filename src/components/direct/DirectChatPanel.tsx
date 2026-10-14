import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Input, Modal, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDirect } from '../../hooks/useDirect';
import { socialError, useSocial } from '../../hooks/useSocial';
import { useDirectMessages } from '../../hooks/useDirectMessages';
import { directService, directUUID } from '../../services/direct';
import type { DirectConversation, DirectMessage } from '../../types/direct';
import ProfileSummary from '../social/ProfileSummary';
import MessageInput from '../MessageInput';
const reasons = { feature_disabled: '私信发送暂未启用', peer_unavailable: '对方账号不可用，仍可查看历史', not_friends: '已解除好友关系，会话仅可查看；重新成为好友后恢复', globally_muted: '你已被全局禁言，仍可查看历史' };
export default function DirectChatPanel() { const { roomId } = useParams(); return roomId ? <ConversationPanel key={roomId} room={roomId} /> : null; }
function ConversationPanel({ room }: { room: string }) {
  const { user } = useAuth(); const direct = useDirect(); const social = useSocial(); const navigate = useNavigate();
  const directRefresh = direct.refresh; const socialRefresh = social.refresh;
  const history = useDirectMessages(room); const synchronize = history.synchronize; const roomPending = direct.pending[room]; const [conversation, setConversation] = useState<DirectConversation | null>(null); const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState<string | null>(null); const [editing, setEditing] = useState<DirectMessage | null>(null); const [editText, setEditText] = useState(''); const [editError, setEditError] = useState<string | null>(null); const [editingBusy, setEditingBusy] = useState(false);
  const [sending, setSending] = useState(false); const sendBusy = useRef(false); const viewport = useRef<HTMLDivElement>(null); const stick = useRef(true); const readPosition = useRef('0'); const readBusy = useRef(false); const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    let current = true;
    void directService.detail(room).then(r => { if (current) { setConversation(r.data); if (BigInt(r.data.lastReadSeq) > BigInt(readPosition.current)) readPosition.current = r.data.lastReadSeq; setError(null); } }).catch(e => { if (current) { setConversation(null); setError(socialError(e)); } });
    return () => { current = false; };
  }, [room, direct.revision, social.revision]);
  const markVisible = useCallback(async () => {
    if (document.hidden || !document.hasFocus() || !viewport.current || readBusy.current || !mounted.current) return;
    const bounds = viewport.current.getBoundingClientRect(); let target: { seq: string; id: string } | null = null;
    for (const element of viewport.current.querySelectorAll<HTMLElement>('[data-direct-seq]')) {
      const rect = element.getBoundingClientRect(); const seq = element.dataset.directSeq ?? '0'; const id = element.dataset.messageId;
      if (id && rect.bottom <= bounds.bottom + 2 && rect.bottom > bounds.top && BigInt(seq) > BigInt(readPosition.current) && (!target || BigInt(seq) > BigInt(target.seq))) target = { seq, id };
    }
    if (!target) return; readBusy.current = true;
    try { const r = await directService.read(room, target.id); if (mounted.current) { readPosition.current = r.data.lastReadSeq; directRefresh(); socialRefresh(); } }
    catch (e) { if (mounted.current) setError(socialError(e)); } finally { readBusy.current = false; }
  }, [room, directRefresh, socialRefresh]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => { if (stick.current && viewport.current) viewport.current.scrollTop = viewport.current.scrollHeight; void markVisible(); });
    return () => cancelAnimationFrame(frame);
  }, [history.messages, history.loading, roomPending, markVisible]);
  useEffect(() => { const visible = () => { if (!document.hidden) { void synchronize(); void markVisible(); } }; window.addEventListener('focus', visible); document.addEventListener('visibilitychange', visible); return () => { window.removeEventListener('focus', visible); document.removeEventListener('visibilitychange', visible); }; }, [synchronize, markVisible]);
  const send = async () => {
    const text = (direct.drafts[room] ?? '').trim(); if (!text || !conversation?.canSend || sendBusy.current) return;
    if (Array.from(text).length > 2000) { setError('消息最多2000个字符'); return; }
    sendBusy.current = true; setSending(true); setError(null); stick.current = true;
    const input = { type: 'text' as const, text, clientMessageId: directUUID(), ...(reply ? { quotedMessageId: reply } : {}) };
    direct.setDraft(room, ''); setReply(null);
    try { await direct.send(room, input); } catch (e) { if (mounted.current) setError(socialError(e)); } finally { sendBusy.current = false; if (mounted.current) setSending(false); }
  };
  const withdraw = async (message: DirectMessage) => { try { const r = await directService.withdraw(room, message.messageId); direct.merge(room, [r.data]); direct.refresh(); } catch (e) { setError(socialError(e)); direct.refresh(); } };
  const saveEdit = async () => { if (!editing || editingBusy) return; setEditingBusy(true); setEditError(null); try { const r = await directService.edit(room, editing.messageId, editText, editing.revision); direct.merge(room, [r.data]); setEditing(null); direct.refresh(); } catch (e) { setEditError(socialError(e)); void history.synchronize(); } finally { setEditingBusy(false); } };
  const loadOlder = async () => { const node = viewport.current; const height = node?.scrollHeight ?? 0; const top = node?.scrollTop ?? 0; stick.current = false; await history.loadMore(); requestAnimationFrame(() => { if (node) node.scrollTop = top + node.scrollHeight - height; }); };
  if (error && !conversation) return <section className="p-8 flex-1"><Alert type="error" message={error} action={<Button onClick={() => navigate('/direct')}>返回私信</Button>} /></section>;
  if (!conversation) return <div className="p-8"><Spin /></div>;
  const pending = direct.pending[room] ?? []; const canSend = conversation.canSend;
  return <section className="flex-1 flex flex-col min-w-0 h-screen text-white" aria-label="私信会话">
    <header className="p-4 border-b border-gray-800 flex items-center justify-between"><ProfileSummary profile={conversation.peer} /><Button onClick={() => navigate(`/user/${conversation.peer.userId}`)}>查看资料</Button></header>
    {conversation.readOnlyReason && <Alert message={reasons[conversation.readOnlyReason]} type="warning" />}
    {(error || history.error) && <Alert type="error" message={error || history.error} action={<Button onClick={() => { direct.refresh(); void history.synchronize(); }}>重试加载</Button>} />}
    <div className="flex-1 overflow-y-auto p-5 space-y-4" ref={viewport} onScroll={() => { const node = viewport.current; if (node) stick.current = node.scrollHeight - node.scrollTop - node.clientHeight < 30; void markVisible(); }} data-testid="direct-timeline">
      {history.more && <Button onClick={() => void loadOlder()}>加载更早消息</Button>}{history.loading && <Spin />}
      {!history.loading && !history.messages.length && <p className="text-center text-gray-500">开始你们的聊天</p>}
      {history.messages.map(message => {
        const mine = message.userId === user?.userId; const quoted = message.quotedMessageId ? (direct.messages[room] ?? []).find(m => m.messageId === message.quotedMessageId) : null;
        const quote = quoted ? { text: quoted.text, isDeleted: quoted.isDeleted, sender: quoted.sender } : message.quote;
        return <article key={message.messageId} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`} data-testid={`message-${message.clientMessageId}`} data-direct-seq={message.directSeq} data-message-id={message.messageId}>
          <div className="text-xs text-gray-500 mb-1">{mine ? '我' : conversation.peer.nickname} · {new Date(message.time).toLocaleTimeString()}</div>
          <div className={`max-w-[85%] rounded-2xl p-3 whitespace-pre-wrap break-words ${mine ? 'bg-blue-700' : 'bg-gray-800'}`}>
            {quote && <div className="border-l-2 border-gray-400 pl-2 text-sm text-gray-300 mb-2" data-testid={`quote-${message.messageId}`}>{quote.sender.nickname}：{quote.isDeleted ? '消息已撤回' : quote.text}</div>}
            <div>{message.isDeleted ? '消息已撤回' : message.text}</div>{message.editedAt && !message.isDeleted && <span className="text-xs text-gray-400">已编辑</span>}
          </div>
          {!message.isDeleted && <div className="flex gap-3 mt-1 text-xs"><button disabled={!canSend} className="text-gray-400 disabled:opacity-40" onClick={() => setReply(message.messageId)}>回复</button>{mine && <><button disabled={!canSend} className="text-gray-400 disabled:opacity-40" onClick={() => { setEditing(message); setEditText(message.text); setEditError(null); }}>编辑</button><button disabled={!canSend} className="text-gray-400 disabled:opacity-40" onClick={() => void withdraw(message)}>撤回</button></>}</div>}
        </article>;
      })}
      {pending.map(p => <article key={p.input.clientMessageId} className="text-right text-gray-400" data-testid={`pending-${p.input.clientMessageId}`}><div className="whitespace-pre-wrap">{p.input.text}</div><span>{p.state === 'sending' ? '发送中…' : p.error || '发送失败'}</span>{p.state === 'failed' && <Button size="small" onClick={() => void direct.send(room, p.input).catch(e => setError(socialError(e)))}>重试原消息</Button>}</article>)}
    </div>
    <MessageInput conversationKind="direct" showPermissionNotice={false} inputValue={direct.drafts[room] ?? ''} onInputChange={text => direct.setDraft(room, text)} onSend={() => void send()} users={[]} currentUserId={user?.userId} messages={history.messages.map(m => ({ messageId: m.messageId, roomId: room, userId: m.userId, userName: m.sender.nickname, type: 'text', text: m.text, time: m.time, isOwn: m.userId === user?.userId }))} canSendMessage={canSend && !sending} muteReason={conversation.readOnlyReason ? reasons[conversation.readOnlyReason] : sending ? '正在确认发送结果…' : null} replyingToMessageId={reply} onCancelReply={() => setReply(null)} />
    <Modal title="编辑私信" open={Boolean(editing)} onCancel={() => !editingBusy && setEditing(null)} onOk={() => void saveEdit()} confirmLoading={editingBusy} okButtonProps={{ disabled: !canSend }} okText="保存" cancelText="取消"><Input.TextArea aria-label="编辑消息内容" value={editText} onChange={e => setEditText(e.target.value)} />{editError && <Alert type="error" message={editError} />}</Modal>
  </section>;
}
