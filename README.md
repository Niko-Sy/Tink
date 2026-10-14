> **当前个人开发方式：** 后端根包读取config.yaml并连接共用云库；前端用`npm run dev:local`请求本地8080，普通`npm run dev`仍请求现有.env云端地址。无需新增后端env文件。部署见根目录P1_SOCIAL_DEPLOYMENT_GUIDE.md；下文严格发布与版本检查属于历史记录。

> 当前交付为第三批S6～S8；历史批次的“未启用”描述仅适用于当时版本。

# ChatRoom
## 第一批好友与通讯录联调

项目根目录运行 `./dev-social.sh`：启动独立本地PostgreSQL 16、已迁移和初始化的后端及前端。账号 alice/bob/carol，测试密码 Testpass123!。首次运行下载PostgreSQL二进制；依赖需先安装。Ctrl-C停止并清理测试数据库，不连接原配置中的业务数据库。

也可分别运行：后端 `make dev-social`，前端 `npm run dev:social`。新增路由：`/contacts`、`/contacts/requests`、`/contacts/:userId`、`/rooms/:roomId`；首页使用home视图。

验证：`npm run build`、`npm run lint`、`npm test`、`npm run test:e2e`。端到端会自动启动隔离后端与前端，需端口18080和11451空闲；首次运行 `npx playwright install chromium`。测试产物test-results/playwright-report不纳入源码。私信与邀请入口显示未启用，后端目前仅提供对应数据库与隔离基础。

## 第二批私信

`./dev-social.sh`的隔离环境升级至000006并开启私信，邀请仍关闭。侧栏“私信”独立列表；/direct/:roomId支持深链接。联系人、公开资料、成员、消息头像可打开同一会话。支持文本、回复、本人编辑/撤回、未读、后台阅读保护及断线变更恢复。

生产后端默认不启用私信写入：先应用迁移，再设置DIRECT_MESSAGES_ENABLED=true并重启。关闭后已有授权历史仍可读。契约见 `../Tink-Backend/DIRECT_API.md`。npm test与npm run test:e2e保留第一批测试并增加单聊覆盖。

## 第三批 S6～S8

首页、群/成员、联系人/公开资料、消息头像使用共享邀请弹窗；申请中心`/contacts/requests?kind=invitations`合并好友与群邀请，支持收到/发出、筛选、分页和历史。接受后加入真实群，刷新、多标签页、切账号和离线补查同步。

根目录`./dev-social.sh`迁移到7且三项社交能力开启。WS使用短期票据，刷新保存独立access/refresh；旧用户需重新登录。Node22.22以上，Vitest5.0.4；测试涵盖17个单元和11个端到端用例。生产依赖审计零漏洞，开发Tailwind3告警和Ant Design分包提示保留说明；不强制升级或隐藏规则。部署见 [交付手册](../P1_SOCIAL_DEPLOYMENT_GUIDE.md)。
