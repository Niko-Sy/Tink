import { Alert, Button, Empty, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useDirect } from '../../hooks/useDirect';
import { useSocial } from '../../hooks/useSocial';
import { DEFAULT_AVATAR_URL } from '../../config/constants';
export default function DirectList({ compact = false }: { compact?: boolean }) {
  const direct = useDirect(); const social = useSocial(); const navigate = useNavigate();
  return <section className={compact ? 'p-2' : 'flex-1 overflow-auto p-6 md:p-10 text-white'} aria-label={compact ? '私信侧栏' : '私信列表'}>
    {!compact && <h1 className="text-2xl font-semibold mb-6">私信</h1>}
    {!social.capabilities?.directMessages && !compact && <Alert className="mb-4" message="私信发送暂未启用，已有会话可查看历史" />}
    {direct.error && <Alert type="error" message={direct.error} action={<Button onClick={direct.refresh}>重试</Button>} />}
    {direct.loading && <Spin />}
    {!direct.loading && !direct.items.length && (compact ? <p className="text-gray-400 p-3">暂无私信</p> : <Empty description="还没有私信，从联系人详情开始聊天" />)}
    <div className="space-y-2">{direct.items.map(room => <button key={room.roomId} className="w-full p-3 rounded-xl bg-gray-800/60 hover:bg-gray-800 text-left text-gray-200 flex gap-3 items-center" onClick={() => navigate(`/direct/${room.roomId}`)} data-testid={`direct-${room.roomId}`}>
      <img src={room.peer.avatar || DEFAULT_AVATAR_URL} alt="头像" className="w-9 h-9 rounded-full" /><div className="min-w-0 flex-1"><div className="font-medium truncate">{room.peer.nickname}</div><div className="text-xs text-gray-400 truncate">{room.lastMessage ? room.lastMessage.isDeleted ? '消息已撤回' : room.lastMessage.text : '开始聊天'}{room.readOnlyReason && ' · 只读'}</div></div>{room.unreadCount > 0 && <span className="rounded-full bg-blue-600 px-2 text-xs" aria-label={`${room.unreadCount}条未读`}>{room.unreadCount}</span>}
    </button>)}</div>
    {direct.hasMore && <Button className="mt-4" onClick={() => void direct.loadMore()}>加载更多会话</Button>}
  </section>;
}
