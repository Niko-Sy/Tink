### 步骤

1. **核心功能缺失（高优先级）**
   * 好友系统完全未实现（[API_REQUIREMENTS.md](vscode-file://vscode-app/d:/Programfiles/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) 第7章定义的所有好友接口）
   * 私信功能完全未实现（`services/index.ts` 中显示"开发中"）
   * 文件/图片上传（`MessageArea.tsx` 和 `UserProfile.tsx` 仅有占位符）
   * 消息搜索功能（无相关组件）
   * 通知中心（仅 WebSocket 推送，无历史查看）
2. **用户体验功能缺失（中优先级）**
   * 所有设置页面未实现（`Sidebar.tsx` 中账号设置/隐私设置/通知设置/帮助中心/反馈建议）
   * 聊天室邀请功能（`App.tsx:171` 显示"开发中"）
   * 消息转发/收藏（`MessageArea.tsx` 有8个功能显示"开发中"）
   * 多媒体消息（图片/文件类型未实现 UI）
   * 消息已读回执（API 已定义但前端未实现）
3. **关键组件缺失**
   * 错误边界组件（React Error Boundary）防止应用崩溃
   * 通知中心组件统一管理系统通知和好友请求
   * 图片/文件预览组件（查看器、下载管理器）
   * 虚拟滚动组件优化大量消息渲染性能（`MessageArea.tsx`）
   * 空状态和骨架屏组件改善加载体验
4. **安全性和代码质量问题**
   * XSS 防护缺失（消息内容未进行 HTML 转义）
   * Token 过期处理不完整（`api.ts:86` 跳转登录被注释）
   * 100+ 处 `console.log` 需清理
   * 硬编码值（主页房间 ID `'100000001'`、WebSocket URL `120.27.227.190`）
   * 内存泄漏风险（`App.tsx` WebSocket 事件监听器清理不完整）

### Further Considerations

1. **实施优先级建议** ：第一阶段修复安全问题和核心 Bug（XSS、Token 过期）→ 第二阶段实现文件上传和设置页面 → 第三阶段扩展社交功能（好友、私信）
2. **性能优化时机** ：当聊天室消息数超过 100 条时实现虚拟滚动，当用户反馈卡顿时优先处理
3. **技术栈选择** ：虚拟滚动推荐 `react-virtuoso`，XSS 防护推荐 `DOMPurify`，表单验证推荐 `zod` 或 `yup`
