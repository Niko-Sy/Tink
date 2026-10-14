import type { PublicUserProfile } from '../../types/social';
import { DEFAULT_AVATAR_URL } from '../../config/constants';
const labels = { online: '在线', away: '离开', busy: '忙碌', offline: '离线' };
export default function ProfileSummary({ profile }: { profile: PublicUserProfile }) {
  return <div className="flex items-center gap-4"><img className="w-12 h-12 rounded-full object-cover" src={profile.avatar || DEFAULT_AVATAR_URL} alt="头像" /><div><div className="text-lg text-white">{profile.nickname}</div><div className="text-sm text-gray-400">{profile.userId} · {profile.availability === 'unavailable' ? '账号不可用' : profile.onlineStatus ? labels[profile.onlineStatus] : '状态未公开'}</div></div></div>;
}
