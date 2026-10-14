import { useEffect, useState } from 'react';
import { Alert, Button, Input, Modal, Radio, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { friendService } from '../../services/friend';
import { socialError, useSocial } from '../../hooks/useSocial';
import type { UserSearchResult } from '../../types/social';
import ProfileSummary from './ProfileSummary';
export default function AddFriendModal({ targetId }: { targetId: string | null }) {
  const { closeAddFriend, refresh, capabilities, revision } = useSocial(); const navigate = useNavigate();
  const [mode, setMode] = useState<'userId' | 'username'>('userId'); const [query, setQuery] = useState(targetId ?? '');
  const [lookup, setLookup] = useState(targetId ?? ''); const [result, setResult] = useState<UserSearchResult | null>(null);
  const [message, setMessage] = useState(''); const [loading, setLoading] = useState(Boolean(targetId));
  const [submitting, setSubmitting] = useState(false); const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!lookup || !capabilities?.friends) return;
    let alive = true;
    const load = async () => {
      setLoading(true);
      try { const response = await friendService.search({ [mode]: lookup }); if (alive) { setResult(response.data[0] ?? null); setError(response.data.length ? null : '未找到该用户'); } }
      catch (e) { if (alive) setError(socialError(e)); }
      finally { if (alive) setLoading(false); }
    };
    void load(); return () => { alive = false; };
  }, [lookup, mode, capabilities?.friends]);
  const resultId = result?.profile.userId;
  useEffect(() => {
    if (!resultId || !capabilities?.friends) return;
    let alive = true;
    void friendService.relationship(resultId).then(response => {
      if (alive) setResult(previous => previous?.profile.userId === resultId ? { ...previous, relationship: response.data } : previous);
    }).catch(() => { /* Preserve the last fact; submission still checks server permissions. */ });
    return () => { alive = false; };
  }, [resultId, revision, capabilities?.friends]);
  const submit = async () => {
    if (!result || submitting) return; setSubmitting(true); setError(null);
    try { const response = await friendService.create(result.profile.userId, message); setResult({ ...result, relationship: response.data.relationship }); refresh(); }
    catch (e) { setError(socialError(e)); if (typeof e === 'object' && e && 'businessCode' in e && e.businessCode === 'INCOMING_REQUEST_PENDING') { closeAddFriend(); navigate('/contacts/requests'); } }
    finally { setSubmitting(false); }
  };
  const relationship = result?.relationship;
  if (!capabilities?.friends) return <Modal title="添加好友" open onCancel={closeAddFriend} footer={null}><Alert message="好友功能暂未启用" /></Modal>;
  return <Modal title="添加好友" open onCancel={closeAddFriend} footer={null} destroyOnHidden>
    <div className="space-y-4">
      {!targetId && <><Radio.Group value={mode} onChange={e => { setMode(e.target.value); setLookup(''); setResult(null); }} options={[{ value: 'userId', label: '用户ID' }, { value: 'username', label: '用户名' }]} /><Input.Search aria-label="查找用户" placeholder={mode === 'userId' ? '输入完整用户ID' : '输入精确用户名'} value={query} onChange={e => { setQuery(e.target.value); setLookup(''); setResult(null); }} onSearch={() => { setLookup(query.trim()); setError(null); }} enterButton="查找" loading={loading} /></>}
      {error && <Alert type="error" showIcon message={error} />}
      {loading ? <Spin /> : result && <><div className="rounded-lg bg-gray-800 p-4"><ProfileSummary profile={result.profile} /></div>
        {relationship?.state === 'none' && <><Input.TextArea aria-label="申请留言" value={message} onChange={e => setMessage(e.target.value)} maxLength={200} showCount placeholder="申请留言（可选）" /><Button type="primary" disabled={!relationship.canRequest} loading={submitting} onClick={() => void submit()}>发送申请</Button>{!relationship.canRequest && <p>对方暂不接受好友申请</p>}</>}
        {relationship?.state === 'outgoing_pending' && <p role="status">申请已发送，等待对方处理。可在“好友申请”中取消。</p>}
        {relationship?.state === 'incoming_pending' && <Button onClick={() => { closeAddFriend(); navigate('/contacts/requests'); }}>处理对方的申请</Button>}
        {relationship?.state === 'friends' && <Button onClick={() => { closeAddFriend(); navigate(`/contacts/${result.profile.userId}`); }}>查看联系人</Button>}
        {relationship?.state === 'self' && <p>不能添加自己为好友</p>}
        {relationship?.state === 'unavailable' && <p>用户不可添加</p>}
      </>}
    </div>
  </Modal>;
}
