import { useInvitations } from "../hooks/useInvitations";
import { useDirect } from "../hooks/useDirect";
import { useEffect, useState } from "react";
import { Alert, Button, Modal, Spin } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import type { FriendContact } from "../types/social";
import { friendService } from "../services/friend";
import { socialError, useSocial } from "../hooks/useSocial";
import ProfileSummary from "../components/social/ProfileSummary";
export default function ContactDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const social = useSocial();
  const invitations = useInvitations();
  const direct = useDirect();
  const [loaded, setLoaded] = useState<{
    id: string;
    contact: FriendContact;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!userId || !social.capabilities?.friends) return;
    let alive = true;
    void friendService
      .contact(userId)
      .then((r) => {
        if (alive) {
          setLoaded({ id: userId, contact: r.data });
          setError(null);
        }
      })
      .catch((e) => {
        if (alive) {
          setLoaded(null);
          setError(socialError(e));
        }
      });
    return () => {
      alive = false;
    };
  }, [userId, social.revision, social.capabilities?.friends]);
  const contact = loaded && loaded.id === userId ? loaded.contact : null;
  const remove = async () => {
    if (!userId || busy) return;
    setBusy(true);
    try {
      await friendService.remove(userId);
      social.refresh();
      navigate("/contacts", { replace: true });
    } catch (e) {
      setError(socialError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="flex-1 p-6 md:p-10 overflow-auto text-white">
      <Button onClick={() => navigate("/contacts")}>返回通讯录</Button>
      <h1 className="text-2xl my-6">联系人详情</h1>
      {error && (
        <Alert
          type="error"
          message={error}
          action={
            <Button onClick={() => userId && navigate(`/user/${userId}`)}>
              查看公开资料
            </Button>
          }
        />
      )}
      {!contact && !error && <Spin />}
      {contact && (
        <div className="max-w-xl bg-gray-800/60 rounded-2xl p-6">
          <ProfileSummary profile={contact.profile} />
          <p className="my-5 whitespace-pre-wrap">
            {contact.profile.signature}
          </p>
          <p className="text-sm text-gray-400">
            成为好友：{new Date(contact.friendSince).toLocaleString()}
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Button
              disabled={!contact.canMessage}
              onClick={() => userId && void direct.start(userId)}
            >
              私信
            </Button>
            <Button
              disabled={
                !social.capabilities?.roomInvitations ||
                contact.profile.availability !== "active"
              }
              onClick={() =>
                userId && invitations.openInvite({ inviteeId: userId })
              }
            >
              邀请到房间
            </Button>
            <Button danger onClick={() => setConfirm(true)}>
              删除好友
            </Button>
          </div>
        </div>
      )}
      <Modal
        title="删除好友"
        open={confirm}
        onCancel={() => !busy && setConfirm(false)}
        onOk={() => void remove()}
        okText="确认删除"
        cancelText="取消"
        confirmLoading={busy}
      >
        <p>解除好友关系，保留历史私信。双方将不能继续发送消息。</p>
        {error && <Alert type="error" message={error} />}
      </Modal>
    </section>
  );
}
