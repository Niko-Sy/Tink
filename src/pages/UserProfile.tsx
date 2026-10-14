import { useInvitations } from "../hooks/useInvitations";
import { useDirect } from "../hooks/useDirect";
import { useEffect, useState } from "react";
import { Alert, Button, Spin } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { friendService } from "../services/friend";
import type { PublicUserProfile, Relationship } from "../types/social";
import { socialError, useSocial } from "../hooks/useSocial";
import ProfileSummary from "../components/social/ProfileSummary";
export default function UserProfile({
  viewMode = "other",
}: {
  viewMode?: "self" | "other";
}) {
  const { userId } = useParams();
  const { user } = useAuth();
  const social = useSocial();
  const invitations = useInvitations();
  const direct = useDirect();
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState<{
    id: string;
    profile: PublicUserProfile;
    relationship: Relationship | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!userId || userId === user?.userId || viewMode === "self") return;
    let alive = true;
    const load = async () => {
      try {
        const p = await friendService.profile(userId);
        const r = social.capabilities?.friends
          ? await friendService.relationship(userId)
          : null;
        if (alive) {
          setLoaded({
            id: userId,
            profile: p.data,
            relationship: r?.data ?? null,
          });
          setError(null);
        }
      } catch (e) {
        if (alive) {
          setLoaded(null);
          setError(socialError(e));
        }
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [
    userId,
    user?.userId,
    viewMode,
    social.revision,
    social.capabilities?.friends,
  ]);
  useEffect(() => {
    if (userId === user?.userId || viewMode === "self")
      navigate("/profile", { replace: true });
  }, [userId, user?.userId, viewMode, navigate]);
  const data = loaded?.id === userId ? loaded : null;
  return (
    <main className="min-h-screen bg-ground text-white p-6 md:p-12">
      <Button onClick={() => navigate(-1)}>返回</Button>
      <h1 className="text-2xl my-6">用户资料</h1>
      {error && (
        <Alert
          type="error"
          message={error}
          action={<Button onClick={social.refresh}>重试</Button>}
        />
      )}
      {!data && !error && <Spin />}
      {data && (
        <div className="max-w-xl bg-gray-800/60 rounded-xl p-6">
          <ProfileSummary profile={data.profile} />
          <p className="whitespace-pre-wrap my-5">{data.profile.signature}</p>
          <div className="flex gap-3 flex-wrap">
            {data.relationship?.state === "friends" ? (
              <Button
                type="primary"
                onClick={() => navigate(`/contacts/${userId}`)}
              >
                查看联系人
              </Button>
            ) : data.relationship?.state === "incoming_pending" ? (
              <Button
                type="primary"
                onClick={() => navigate("/contacts/requests")}
              >
                处理好友申请
              </Button>
            ) : (
              <Button
                type="primary"
                disabled={
                  !social.capabilities?.friends ||
                  data.relationship?.state === "unavailable"
                }
                onClick={() => social.openAddFriend(userId)}
              >
                {data.relationship?.state === "outgoing_pending"
                  ? "查看已发送申请"
                  : "添加好友"}
              </Button>
            )}
            <Button
              disabled={
                !social.capabilities?.directMessages ||
                data.profile.availability !== "active"
              }
              onClick={() => userId && void direct.start(userId)}
            >
              私信
            </Button>
            <Button
              disabled={
                !social.capabilities?.roomInvitations ||
                data.profile.availability !== "active"
              }
              onClick={() =>
                userId && invitations.openInvite({ inviteeId: userId })
              }
            >
              邀请到房间
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
