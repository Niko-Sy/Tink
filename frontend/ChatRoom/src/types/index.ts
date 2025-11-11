// 统一的用户接口定义 - 与AuthContext保持一致
export interface User {
  userId: string;
  name: string;
  status: string;
  avatar: string;
  username?: string;
  nickname?: string;
  phone?: string;
  email?: string;
  signature?: string;
  onlineStatus?: 'online' | 'away' | 'busy' | 'offline';
  accountStatus?: 'active' | 'inactive' | 'suspended';
  role?: 'admin' | 'moderator' | 'user';
}

// 消息接口
export interface Message {
  id: number;
  userId: string; // 改为string类型,与User的userId一致
  userName: string;
  text: string;
  time: string;
  isOwn: boolean;
}

// 聊天室接口
export interface ChatRoom {
  id: number;
  name: string;
  icon: string;
  unread: number;
  roomId: string;
}
