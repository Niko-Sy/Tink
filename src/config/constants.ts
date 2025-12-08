/**
 * 应用常量配置
 * 集中管理所有硬编码的值，便于维护和环境切换
 */

// ============ 应用基础配置 ============

/** 主页房间ID（系统默认房间） */
export const HOME_ROOM_ID = '100000001';

/** 默认头像URL */
export const DEFAULT_AVATAR_URL = 'https://www.tastywhut.site/pic/avatars/DefaultAvatar.png';

// ============ API 配置 ============

/** API 基础URL（从环境变量读取，如未设置则使用默认值） */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://120.27.227.190:8080/api/v1';

/** WebSocket URL（从环境变量读取，如未设置则使用默认值） */
export const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'ws://120.27.227.190:8080/ws';

/** API 请求超时时间（毫秒） */
export const API_TIMEOUT = 30000;

// ============ 消息配置 ============

/** 单次加载的消息数量 */
export const MESSAGE_PAGE_SIZE = 50;

/** 消息最大长度（字符数） */
export const MAX_MESSAGE_LENGTH = 2000;

/** 消息输入框占位符文本 */
export const MESSAGE_PLACEHOLDER = '输入消息...';

/** 禁言状态下的输入框占位符 */
export const MUTED_PLACEHOLDER = '你已被禁言，无法发送消息';

// ============ 文件上传配置 ============

/** 头像文件最大尺寸（字节）- 5MB */
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

/** 头像允许的文件类型 */
export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/** 聊天图片最大尺寸（字节）- 10MB */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

/** 聊天文件最大尺寸（字节）- 50MB */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

// ============ 聊天室配置 ============

/** 聊天室名称最小长度 */
export const MIN_ROOM_NAME_LENGTH = 1;

/** 聊天室名称最大长度 */
export const MAX_ROOM_NAME_LENGTH = 20;

/** 聊天室描述最大长度 */
export const MAX_ROOM_DESCRIPTION_LENGTH = 100;

// ============ 用户配置 ============

/** 用户名最小长度 */
export const MIN_USERNAME_LENGTH = 3;

/** 用户名最大长度 */
export const MAX_USERNAME_LENGTH = 20;

/** 密码最小长度 */
export const MIN_PASSWORD_LENGTH = 6;

/** 密码最大长度 */
export const MAX_PASSWORD_LENGTH = 20;

/** 昵称最大长度 */
export const MAX_NICKNAME_LENGTH = 20;

/** 个性签名最大长度 */
export const MAX_SIGNATURE_LENGTH = 100;

// ============ WebSocket 配置 ============

/** WebSocket 重连延迟（毫秒） */
export const WEBSOCKET_RECONNECT_DELAY = 3000;

/** WebSocket 最大重连次数 */
export const WEBSOCKET_MAX_RECONNECT_ATTEMPTS = 10;

/** WebSocket 心跳间隔（毫秒） */
export const WEBSOCKET_HEARTBEAT_INTERVAL = 30000;

// ============ UI 配置 ============

/** 通知显示位置 */
export const NOTIFICATION_PLACEMENT = 'topRight' as const;

/** 通知默认显示时长（秒） */
export const NOTIFICATION_DURATION = 3;

/** 通知最大同时显示数量 */
export const NOTIFICATION_MAX_COUNT = 3;

/** 成功通知默认时长（秒） */
export const SUCCESS_NOTIFICATION_DURATION = 2;

/** 错误通知默认时长（秒） */
export const ERROR_NOTIFICATION_DURATION = 2;

/** 警告通知默认时长（秒） */
export const WARNING_NOTIFICATION_DURATION = 3;

// ============ 禁言时长选项（秒） ============

/** 禁言时长选项 */
export const MUTE_DURATION_OPTIONS = [
  { label: '5分钟', value: 5 * 60 },
  { label: '30分钟', value: 30 * 60 },
  { label: '1小时', value: 60 * 60 },
  { label: '24小时', value: 24 * 60 * 60 },
  { label: '7天', value: 7 * 24 * 60 * 60 },
  { label: '永久', value: 0 },
] as const;

// ============ 开发配置 ============

/** 是否为开发环境 */
export const IS_DEV = import.meta.env.DEV;

/** 是否为生产环境 */
export const IS_PROD = import.meta.env.PROD;

/** 应用版本 */
export const APP_VERSION = '1.0.0';
