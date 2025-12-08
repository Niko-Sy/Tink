## Plan: Tink ChatRoom 前端 API 对接实现计划

根据 [API_REQUIREMENTS.md](vscode-file://vscode-app/d:/Program%20files/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) 接口文档和当前代码分析，项目已有完善的 UI 和权限系统，但所有数据均为模拟数据，需要按模块逐步对接后端 API。以下是分阶段实现计划。

---

### Steps

1. **创建 API 服务层基础架构** - 在 `src/services/` 目录下创建 `api.ts`（Axios 实例配置、拦截器、Token 管理）作为所有 API 调用的基础
2. **实现认证模块对接** - 创建 `src/services/auth.ts`，实现登录/注册/登出/刷新Token API；重构 [AuthContext.tsx](vscode-file://vscode-app/d:/Program%20files/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) 中的 `login`/`logout` 函数调用真实接口
3. **实现 WebSocket 实时通信模块** - 创建 `src/services/websocket.ts` 封装 WebSocket 客户端类，支持连接、心跳、消息收发、重连；创建 `src/hooks/useWebSocket.ts` 供组件使用
4. **实现聊天室模块对接** - 创建 `src/services/chatroom.ts`；重构 [App.tsx](vscode-file://vscode-app/d:/Program%20files/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) 中的 `chatRooms` 状态从 `GET /users/me/chatrooms` 获取；对接创建/加入/退出聊天室 API
5. **实现消息模块对接** - 创建 `src/services/message.ts`；重构消息列表从 `GET /chatroom/:roomid/messages` 获取历史记录；消息发送改为通过 WebSocket 发送，并监听 `message` 事件实时更新
6. **实现成员管理模块对接** - 创建 `src/services/member.ts`；重构 [UserListPanel.tsx](vscode-file://vscode-app/d:/Program%20files/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) 从 API 获取成员列表；对接禁言/踢出/设置管理员等管理功能

---

### Further Considerations

1. **API 服务层放置位置** - 建议新建 `src/services/` 目录统一管理，还是放在 `src/api/` 目录？
2. **状态管理方案** - 当前使用 React Context，是否需要引入 Zustand/Redux 管理复杂的聊天室和消息状态，或保持现有 Context 方案？
3. **好友系统和通知模块** - 这两个模块目前 UI 预留较少，是否放到下一期实现，还是本期一并规划？
