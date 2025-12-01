# 禁言状态同步问题调试

## 问题现象

**用户 U100000000 发送消息时：**
- ✅ 前端权限检查：`isMuted: false` - 通过
- ❌ 服务器返回：`You are muted and cannot send messages` - 禁言中

**矛盾点：** 前端认为用户未被禁言，但服务器认为用户已被禁言

## 可能的原因

### 1. 未收到禁言通知
服务器在禁言时应该发送两种消息：
- **个人通知**: `{"type":"notification","action":"muted","data":{...}}`
- **系统广播**: `{"type":"message","action":"new","data":{"type":"system_notification","text":"XXX已被禁言"}}`

**检查点：** 控制台中是否有这两种消息的日志？

### 2. 禁言通知被忽略
可能的问题：
- WebSocket 事件监听器未正确注册
- `handleNotification` 或 `handleSystemNotificationMessage` 未被调用
- `updateUserMuteStatus` 被调用但未生效（闭包问题）

### 3. 页面加载时状态未同步
- 用户在被禁言后刷新页面
- `fetchCurrentMemberInfo` 未正确获取禁言状态
- `fetchRoomMembers` 未包含禁言状态

## 调试步骤

### 第一步：检查是否收到禁言通知
在控制台搜索以下关键词：
```
[WebSocket] 收到消息类型: notification
[useWebSocketEvents] 🔔 收到个人通知
[useWebSocketEvents] 📢 处理系统通知消息
```

### 第二步：检查成员信息获取
查看以下日志：
```
[App] 更新 currentRoomMember
聊天室成员列表（含权限信息）
当前用户成员信息
```

### 第三步：检查状态更新链
追踪以下调用链：
```
handleNotification
  → updateUserMuteStatus (userId=U100000000, isMuted=true)
    → setUsers (更新users数组)
  → updateCurrentMemberMuteStatus (roomId, isMuted=true)
    → setCurrentRoomMember (更新currentRoomMember)
```

## 已修复的问题

### ✅ 闭包陷阱
**问题：** `useRoomMembers.ts` 中 `updateUserMuteStatus` 依赖 `users` 数组
```typescript
// ❌ 错误：闭包陷阱
const updateUserMuteStatus = useCallback((userId, isMuted, muteUntil) => {
  console.log('当前用户列表:', users);  // users 可能是旧值
  setUsers(prev => ...);
}, [users]);  // 依赖 users 会导致闭包问题

// ✅ 正确：使用函数式更新
const updateUserMuteStatus = useCallback((userId, isMuted, muteUntil) => {
  setUsers(prev => {
    console.log('更新前用户列表:', prev);  // prev 是最新值
    return prev.map(u => ...);
  });
}, []);  // 无依赖
```

### ✅ userId 提取逻辑
**问题：** 系统通知消息可能不包含 `userId`，需要从 `memberId` 提取
```typescript
// memberId 格式: M_U100000003_100000004
const memberIdMatch = data.memberId.match(/M_(U\d+)_/);
if (memberIdMatch && memberIdMatch[1]) {
  targetUserId = memberIdMatch[1];  // U100000003
}
```

### ✅ 个人通知处理
**问题：** 个人通知的 `userId` 是可选的，缺失时表示当前用户
```typescript
const targetUserId = data.userId || user.userId;
const isCurrentUser = !data.userId || targetUserId === user.userId;
```

## 待验证

### 需要测试的场景

1. **禁言操作时是否收到通知**
   - 执行禁言操作
   - 检查控制台是否有：`[useWebSocketEvents] 🔔 收到个人通知`
   - 检查控制台是否有：`[useWebSocketEvents] 📢 处理系统通知消息`

2. **状态是否正确更新**
   - 检查：`[useRoomMembers] ✅ 用户列表已更新`
   - 检查：`isMuted: false → true`

3. **权限检查是否使用最新状态**
   - 禁言后立即尝试发送消息
   - 检查：`[权限检查] canSendMessage: {isMuted: true}`

4. **刷新页面后状态是否保持**
   - 禁言用户后刷新页面
   - 检查：`当前用户成员信息: {isMuted: true}`

## 下一步行动

如果仍然无法同步状态，需要：
1. 在控制台中完整复制禁言操作前后的所有日志
2. 检查服务器是否真的发送了禁言通知
3. 可能需要在页面加载时主动查询禁言状态
