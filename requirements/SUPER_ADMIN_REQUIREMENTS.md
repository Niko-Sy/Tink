# 超级管理员功能需求补充文档

## 当前缺失的功能

### 1. 后端API接口缺失

#### 1.1 全局用户管理接口

```typescript
// 获取所有用户列表（仅super_admin）
GET /admin/users
Query: ?page=1&pageSize=20&status=all|active|suspended&search=username

// 全局禁言用户（仅super_admin）
POST /admin/users/:userId/global-mute
Body: {
  duration: number,  // 秒，0表示永久
  reason?: string
}

// 解除全局禁言（仅super_admin）
POST /admin/users/:userId/global-unmute

// 封禁/解封用户账号（仅super_admin）
POST /admin/users/:userId/suspend
POST /admin/users/:userId/activate

// 设置用户系统角色（仅super_admin，且不能设置自己）
POST /admin/users/:userId/set-role
Body: {
  systemRole: 'super_admin' | 'user'
}
```

#### 1.2 系统监控接口

```typescript
// 获取系统统计数据（仅super_admin）
GET /admin/stats
Response: {
  totalUsers: number,
  onlineUsers: number,
  totalRooms: number,
  totalMessages: number,
  todayMessages: number
}

// 获取举报列表（仅super_admin）
GET /admin/reports
Query: ?status=pending|resolved|rejected&type=user|message

// 处理举报（仅super_admin）
POST /admin/reports/:reportId/handle
Body: {
  action: 'resolve' | 'reject',
  note?: string
}
```

### 2. 前端UI功能缺失

#### 2.1 超级管理员专用菜单

在 `UserListPanel` 和 `MessageArea` 的用户右键菜单中，需要为 `super_admin` 添加:

```typescript
// 超级管理员专用菜单项
if (checkUserRole.isSuperAdmin(user)) {
  menuItems.push(
    createDivider(),
    {
      key: 'globalMute',
      label: '全局禁言',
      icon: '🔇',
      className: 'text-red-500'
    },
    {
      key: 'suspendAccount',
      label: '封禁账号',
      icon: '🚫',
      className: 'text-red-500'
    },
    {
      key: 'viewAllRooms',
      label: '查看用户所有聊天室',
      icon: '👀'
    }
  );
}
```

#### 2.2 系统管理面板

创建新页面 `src/pages/AdminPanel.tsx`:

```typescript
// 功能包括:
- 用户管理（列表、搜索、禁言、封禁）
- 聊天室管理（查看所有聊天室、强制解散）
- 举报处理
- 系统统计图表
- 日志查看
```

#### 2.3 全局禁言弹窗

创建 `src/components/GlobalMuteMemberModal.tsx`:

```typescript
// 类似 MuteMemberModal，但用于全局禁言
- 支持永久禁言
- 显示禁言原因
- 禁言记录历史
```

### 3. WebSocket事件补充

```typescript
// 全局禁言通知（发送给被禁言用户）
{
  "type": "global_mute",
  "action": "muted" | "unmuted",
  "data": {
    "userId": "U123456789",
    "muteUntil": "2025-11-23T11:00:00Z",
    "reason": "违反社区规定",
    "operatorId": "U000000001"  // super_admin的ID
  }
}

// 账号封禁通知（强制下线）
{
  "type": "account_status",
  "action": "suspended" | "activated",
  "data": {
    "userId": "U123456789",
    "reason": "严重违规",
    "operatorId": "U000000001"
  }
}
```

### 4. 权限保护机制

#### 4.1 后端验证

```go
// 所有super_admin接口都需要验证:
func RequireSuperAdmin(c *gin.Context) {
    user := c.MustGet("user").(*models.User)
    if user.SystemRole != "super_admin" {
        c.JSON(403, gin.H{"error": "需要超级管理员权限"})
        c.Abort()
        return
    }
    c.Next()
}

// 防止设置自己为super_admin
func SetUserRole(c *gin.Context) {
    currentUser := c.MustGet("user").(*models.User)
    targetUserId := c.Param("userId")
  
    // 不能修改自己的角色
    if currentUser.UserID == targetUserId {
        c.JSON(400, gin.H{"error": "不能修改自己的系统角色"})
        return
    }
  
    // 只有super_admin可以设置角色
    if currentUser.SystemRole != "super_admin" {
        c.JSON(403, gin.H{"error": "需要超级管理员权限"})
        return
    }
  
    // 执行角色更新...
}
```

#### 4.2 前端保护

```typescript
// 在 Profile.tsx 中禁止修改 systemRole
<select
  value={editedProfile.systemRole}
  onChange={(e) => setEditedProfile({...editedProfile, systemRole: e.target.value})}
  disabled={true}  // 禁止前端修改
  className="opacity-50 cursor-not-allowed"
>
  <option value="user">普通用户</option>
  <option value="super_admin">超级管理员</option>
</select>
```

### 5. 建议的实现优先级

#### P0 - 高优先级（核心功能）

- [ ] 全局禁言/解禁API
- [ ] 后端权限验证中间件
- [ ] WebSocket全局禁言事件
- [ ] 前端全局禁言UI

#### P1 - 中优先级（管理功能）

- [ ] 用户列表管理API
- [ ] 账号封禁/激活API
- [ ] 超级管理员专用菜单
- [ ] 系统统计API

#### P2 - 低优先级（增强功能）

- [ ] 系统管理面板页面
- [ ] 举报处理系统
- [ ] 日志查看功能
- [ ] 数据导出功能

## 总结

当前系统已经建立了 `super_admin` 的基础框架:

- ✅ 数据模型定义完整
- ✅ 基础权限检查逻辑实现
- ✅ 前端可以显示角色

但是**缺乏实际可用的管理功能**:

- ❌ 没有全局用户管理接口
- ❌ 没有超级管理员专用UI
- ❌ 没有系统级操作的API
- ❌ 权限保护机制不完善

建议优先实现全局禁言功能和权限保护机制，再逐步补充完整的管理面板。
