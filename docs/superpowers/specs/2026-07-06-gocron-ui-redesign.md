# gocron v2.0 全栈重构设计规格

> 日期: 2026-07-06 | 状态: 待审查

---

## 1. 概述

本次重构将 gocron 的 UI/UX 全面升级为现代简洁风格，技术栈从 Vue 2 + Element UI 迁移到 Vue 3 + Element Plus，同时新增功能改善用户体验。

### 1.1 核心目标

- **现代简洁 UI**: 浅色主题、卡片式布局、圆角柔和阴影、统计概览
- **交互友好**: 减少操作步骤、实时反馈、清晰的视觉层次
- **技术升级**: 一次性全量重写前端至 Vue 3 + Element Plus
- **功能增强**: POST 请求参数配置、crontab 实时预览、JSON 文本模式
- **通知渠道替换**: 移除 Slack，新增飞书机器人 + 企业微信机器人

### 1.2 设计原则

- **YAGNI**: 只做当前需要的功能，不为未来过度设计
- **渐进增强**: 核心功能先保证可用，再增强体验
- **视觉一致性**: 全局统一的配色、间距、组件风格

---

## 2. 技术栈变更

| 项目 | 当前 | 目标 |
|------|------|------|
| 前端框架 | Vue 2.x | Vue 3.x (Composition API) |
| UI 框架 | Element UI | Element Plus |
| 构建工具 | Webpack 3.x | Vite |
| 状态管理 | Vuex | Pinia |
| 路由 | Vue Router 3.x | Vue Router 4.x |
| 后端框架 | Macaron | Macaron (保持不变) |
| ORM | Xorm | Xorm (保持不变) |
| 通知 | 邮件/Slack/Webhook | 邮件/飞书/企业微信/Webhook |

### 2.1 前端项目结构

```
web/
├── public/
├── src/
│   ├── api/              # API 请求模块
│   │   ├── task.js
│   │   ├── host.js
│   │   ├── user.js
│   │   ├── notification.js
│   │   ├── taskLog.js
│   │   ├── system.js
│   │   └── install.js
│   ├── assets/           # 静态资源
│   ├── components/       # 全局组件
│   │   ├── AppHeader.vue       # 顶部导航栏（新建）
│   │   ├── StatCard.vue        # 统计卡片组件（新建）
│   │   ├── CronPreview.vue     # cron 表达式实时预览（新建）
│   │   ├── JsonEditor.vue      # JSON 编辑器组件（新建）
│   │   ├── RequestParams.vue   # HTTP 请求参数配置（新建）
│   │   └── NotFound.vue        # 404 页面
│   ├── composables/      # Composition API 公共逻辑（新建）
│   │   ├── useCron.js          # cron 表达式解析
│   │   └── usePagination.js    # 分页逻辑
│   ├── pages/            # 页面组件
│   │   ├── dashboard/          # 仪表盘首页（新建）
│   │   │   └── index.vue
│   │   ├── task/
│   │   │   ├── list.vue        # 任务列表（整合到仪表盘）
│   │   │   └── edit.vue        # 任务编辑/创建
│   │   ├── host/
│   │   │   ├── list.vue
│   │   │   └── edit.vue
│   │   ├── user/
│   │   │   ├── login.vue
│   │   │   ├── list.vue
│   │   │   ├── edit.vue
│   │   │   ├── editPassword.vue
│   │   │   └── editMyPassword.vue
│   │   ├── taskLog/
│   │   │   └── list.vue
│   │   ├── system/
│   │   │   └── notification/   # 通知设置（标签页扁平化）
│   │   │       ├── email.vue
│   │   │       ├── feishu.vue       # 新增
│   │   │       ├── wecom.vue        # 新增
│   │   │       └── webhook.vue
│   │   ├── loginLog/
│   │   │   └── list.vue
│   │   └── install/
│   │       └── index.vue
│   ├── router/
│   │   └── index.js
│   ├── stores/            # Pinia stores
│   │   └── user.js
│   ├── utils/
│   │   └── httpClient.js
│   ├── App.vue
│   └── main.js
├── index.html
├── package.json
└── vite.config.js
```

### 2.2 后端变更范围

| 模块 | 变更 |
|------|------|
| `internal/modules/notify/slack.go` | **删除** |
| `internal/modules/notify/feishu.go` | **新增** — 飞书机器人通知 |
| `internal/modules/notify/wecom.go` | **新增** — 企业微信机器人通知 |
| `internal/modules/notify/notify.go` | **修改** — taskType 映射变更: 2→飞书, 3→企微, 4→Webhook |
| `internal/models/task.go` | **新增** — `request_params` 字段 (TEXT, 存储 JSON 请求参数) |
| `internal/routers/task/task.go` | **修改** — 任务创建/更新接口增加 request_params 字段 |
| 数据库迁移 | **新增** — migration 添加 request_params 列 |

---

## 3. 页面设计

### 3.1 导航结构

**顶部标签式导航** — 无侧边栏，顶部横向导航切换。

```
┌─────────────────────────────────────────────────┐
│ ⚡ gocron    任务管理 │ 任务节点 │ 用户 │ 系统   👤 admin │
├─────────────────────────────────────────────────┤
│                                                 │
│  (内容区域)                                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

- Logo + 应用名称在最左
- 导航标签水平排列
- 用户头像 + 下拉菜单（修改密码 / 退出）在最右
- 选中标签底部有高亮指示线
- 主色调: #4f46e5 (靛蓝)

### 3.2 仪表盘首页 (`/`)

整合型首页，替代原来的任务列表页作为默认首页。

**布局:**
```
┌─────────────────────────────────────────────────┐
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │  统计卡片区
│  │📋 总任务│ │✅ 运行中│ │❌ 失败24h│ │🖥 在线节点│           │
│  │  128  │ │  96   │ │   3   │ │   8   │           │
│  └──────┘ └──────┘ └──────┘ └──────┘           │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ 🔍 搜索...              + 新增  🔄 刷新 │    │  搜索+操作栏
│  ├─────────────────────────────────────────┤    │
│  │ 任务名称 │标签│ cron  │方式│状态│ 操作  │    │  任务表格
│  │ 数据备份 │ DB │0 2 * *│shell│● 运行│ ⋯  │    │
│  │ 日志清理 │运维│0 4 * 0│shell│● 停止│ ⋯  │    │
│  └─────────────────────────────────────────┘    │
│  ◀ 1 2 3 ... 10 ▶  共128条                      │  分页
└─────────────────────────────────────────────────┘
```

**统计卡片:**
- 总任务数（蓝色图标）
- 运行中（绿色图标）
- 近24h失败数（红色图标）
- 在线节点数（天蓝图标）
- 使用 `StatCard` 组件，点击卡片可快速筛选

**任务表格改进:**
- 操作列改为图标按钮（执行 ⚡ / 编辑 ✏️ / 日志 📋 / 删除 🗑），减少空间占用
- 状态用彩色圆点 + 文字表示
- 标签用彩色徽章
- 支持表格行点击展开详情（不变）
- 展开行显示: 创建时间、任务类型、超时、重试配置、节点列表、命令

### 3.3 登录页 (`/user/login`)

独立全屏登录页。

```
┌─────────────────────────────────────────────────┐
│           (渐变背景 #667eea → #764ba2)            │
│                                                 │
│            ┌───────────────────┐                │
│            │      ⚡            │                │
│            │     gocron        │                │
│            │  定时任务管理系统   │                │
│            │                   │                │
│            │  用户名           │                │
│            │  [_____________]  │                │
│            │                   │                │
│            │  密码             │                │
│            │  [_____________]  │                │
│            │                   │                │
│            │  [    登 录    ]  │                │
│            │                   │                │
│            │    gocron v2.0    │                │
│            └───────────────────┘                │
│                                                 │
└─────────────────────────────────────────────────┘
```

- 居中白色卡片，圆角 16px
- 渐变背景（靛蓝 → 紫罗兰）
- 输入框带标签提示
- 底部版本号

### 3.4 任务编辑/创建页 (`/task/create`, `/task/edit/:id`)

表单分区设计，信息分组清晰。

**分区:**
1. **基本信息** — 任务名称、标签、任务类型、依赖关系、子任务ID
2. **调度配置** — crontab 表达式 + 实时预览（🆕）
3. **执行配置** — 执行方式、请求方法、任务节点/URL、命令、请求参数（🆕）
4. **高级配置** — 超时、单实例、重试次数、重试间隔
5. **通知配置** — 通知状态、通知类型、接收人

**🆕 crontab 实时预览:**
- 绿色卡片展示下次执行时间（大字突出）
- 后续 5 次执行时间列表
- 前端用 cron-parser 库实时计算
- 表达式不合法时卡片变红显示错误提示
- 输入时 300ms 防抖

**🆕 HTTP POST 请求参数:**
- 仅当 `执行方式=HTTP 且 请求方法=POST` 时显示
- 支持两种模式切换:
  - **JSON 文本模式**: 语法高亮代码编辑区，直接粘贴 JSON
  - **表单模式**: 键值对逐行编辑，动态增删
- 两种模式双向转换
- JSON 文本模式支持:
  - 格式化按钮美化排版
  - 保存时 JSON 合法性校验
  - 从文件导入
  - 一键复制
- Headers 子区域独立（至少包含 Content-Type）
- Body 类型切换: JSON / Form-Data / x-www-form-urlencoded

### 3.5 任务日志页 (`/task/log`)

改进点:
- 搜索栏紧凑排列
- 状态标签优化（失败红色、执行中蓝色旋转动画、成功绿色、取消灰色）
- 执行结果弹窗改为侧边抽屉
- 代码/日志输出使用深色背景代码块

### 3.6 任务节点页 (`/host`)

- 列表页新增统计卡片（总节点数、在线数）
- 表格操作改为图标按钮
- 测试连接结果实时反馈

### 3.7 用户管理页 (`/user`)

- 去除侧边栏，纯内容区布局
- 角色显示为彩色徽章（管理员/普通用户）
- 状态开关交互一致

### 3.8 系统通知设置 (`/system/notification`)

**去除侧边栏**，标签切换扁平化到内容区顶部。

标签页: 邮件 | 飞书 | 企业微信 | Webhook

**🆕 飞书机器人:**
- Webhook URL + 签名校验 Secret
- 支持多群组管理（标签形式，可增删）
- Markdown 格式消息模板
- 测试连接按钮

**🆕 企业微信机器人:**
- Webhook URL
- 支持多群组管理
- Markdown / 文本格式消息模板

**模板变量保持不变:** `{{TaskId}}`, `{{TaskName}}`, `{{Status}}`, `{{Result}}`

### 3.9 登录日志 & 安装页

- 登录日志: 去除侧边栏，纯表格布局
- 安装页: 保持分区布局，优化视觉间距

---

## 4. 全局设计规范

### 4.1 色彩

| Token | 色值 | 用途 |
|-------|------|------|
| Primary | `#4f46e5` | 主按钮、选中态、链接 |
| Primary Light | `#e0e7ff` | 选中背景、标签背景 |
| Success | `#10b981` | 运行中、成功状态 |
| Warning | `#d97706` | 警告 |
| Danger | `#ef4444` | 删除、失败、停止 |
| Info | `#0ea5e9` | 信息提示 |
| Text Primary | `#1a1a2e` | 主要文字 |
| Text Secondary | `#666666` | 次要文字 |
| Text Muted | `#999999` | 辅助文字 |
| Background | `#f8f9fb` | 页面背景 |
| Surface | `#ffffff` | 卡片/表格背景 |
| Border | `#f0f0f0` | 边框/分割线 |

### 4.2 间距

- 页面内边距: 28px 32px
- 卡片内边距: 20px 24px
- 表单项间距: 24px
- 组件间距: 16px
- 卡片圆角: 12px
- 按钮/输入框圆角: 8px

### 4.3 字体

- 页面标题: 20px / font-weight 700
- 卡片标题: 16px / font-weight 600
- 正文: 14px
- 辅助文字: 12px-13px
- 代码/monospace: SF Mono, Monaco, Menlo, monospace

### 4.4 阴影

- 卡片: `0 1px 3px rgba(0, 0, 0, 0.04)`
- 弹窗: `0 20px 60px rgba(0, 0, 0, 0.15)`
- 下拉菜单: `0 4px 12px rgba(0, 0, 0, 0.08)`

---

## 5. 组件设计

### 5.1 StatCard 统计卡片

```vue
<StatCard icon="📋" label="总任务数" :value="128" color="primary" />
```

- 图标 + 文字水平布局
- 图标区域 48x48px 圆角色块
- 数值大字 26px bold
- 支持点击事件

### 5.2 CronPreview cron 预览

```vue
<CronPreview v-model="spec" />
```

- 实时解析用户输入的 cron 表达式
- 有效时: 绿色卡片展示下次执行时间 + 后续 5 次列表
- 无效时: 红色卡片 + 错误信息
- 300ms 防抖
- 前端 cron-parser 库

### 5.3 JsonEditor JSON 编辑器

```vue
<JsonEditor v-model="jsonText" />
```

- 深色背景代码编辑区
- 基本语法高亮（字符串/数字/布尔/键名不同颜色）
- 格式化按钮
- 保存时 JSON.parse 校验
- 从文件导入按钮

### 5.4 RequestParams 请求参数

```vue
<RequestParams v-model="params" v-model:headers="headers" />
```

- JSON 文本模式 / 表单模式 一键切换
- Headers 子区域
- Body 类型: JSON / Form-Data / x-www-form-urlencoded
- 双向转换时的联动逻辑

---

## 6. 后端接口变更

### 6.1 任务模型新增字段

```go
// internal/models/task.go
type Task struct {
    // ...现有字段
    RequestParams string `xorm:"TEXT" json:"request_params"` // JSON 字符串
}
```

### 6.2 通知类型映射变更

```go
// internal/modules/notify/notify.go
const (
    NotifyTypeMail   int8 = 1 // 邮件
    NotifyTypeFeishu int8 = 2 // 飞书 (原 Slack=2)
    NotifyTypeWeCom  int8 = 3 // 企业微信 (原 Webhook=3)
    NotifyTypeWebhook int8 = 4 // Webhook (原值3，现调整为4)
)
```

### 6.3 飞书通知模块

```go
// internal/modules/notify/feishu.go
type Feishu struct {
    Url    string
    Secret string // 签名校验
}

func (f *Feishu) Send(msg Message) {
    // 1. 根据配置获取 Webhook URL + Secret
    // 2. 模板变量替换
    // 3. 生成签名（如配置了 Secret）
    // 4. POST 到飞书 Webhook API
}
```

### 6.4 企业微信通知模块

```go
// internal/modules/notify/wecom.go
type WeCom struct {
    Url string
}

func (w *WeCom) Send(msg Message) {
    // 1. 根据配置获取 Webhook URL
    // 2. 模板变量替换
    // 3. POST 到企业微信 Webhook API
}
```

### 6.5 数据库迁移

```sql
-- 1. 任务表新增请求参数字段
ALTER TABLE task ADD COLUMN request_params TEXT DEFAULT '' AFTER command;

-- 2. 通知类型数据迁移: 旧 Webhook(3) → 新 Webhook(4)
--    旧的 Slack(2) 配置作废，用户需重新配置飞书
UPDATE task SET notify_type = 4 WHERE notify_type = 3;
```

### 6.6 仪表盘统计 API

新增 `GET /api/dashboard/stats` 接口，返回:

```json
{
  "total_tasks": 128,
  "active_tasks": 96,
  "failed_last_24h": 3,
  "online_hosts": 8
}
```

- `total_tasks`: `SELECT COUNT(*) FROM task WHERE level = 1`
- `active_tasks`: `SELECT COUNT(*) FROM task WHERE level = 1 AND status = 1`
- `failed_last_24h`: `SELECT COUNT(DISTINCT task_id) FROM task_log WHERE status = 0 AND start_time > NOW() - INTERVAL 24 HOUR`
- `online_hosts`: 通过 gRPC ping 各节点统计在线数（或使用 heartbeat 机制）

---

## 7. 路由设计

```js
const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'dashboard', component: Dashboard },  // 新建
  { path: '/task/create', name: 'task-create', component: TaskEdit },
  { path: '/task/edit/:id', name: 'task-edit', component: TaskEdit },
  { path: '/task/log', name: 'task-log', component: TaskLog },
  { path: '/host', name: 'host-list', component: HostList },
  { path: '/host/create', name: 'host-create', component: HostEdit },
  { path: '/host/edit/:id', name: 'host-edit', component: HostEdit },
  { path: '/user/login', name: 'user-login', component: UserLogin, meta: { noLogin: true } },
  { path: '/user', name: 'user-list', component: UserList },
  { path: '/user/create', name: 'user-create', component: UserEdit },
  { path: '/user/edit/:id', name: 'user-edit', component: UserEdit },
  { path: '/user/edit-password/:id', name: 'user-edit-password', component: UserEditPassword },
  { path: '/user/edit-my-password', name: 'user-edit-my-password', component: EditMyPassword },
  { path: '/system/notification', redirect: '/system/notification/email' },
  { path: '/system/notification/email', name: 'notify-email', component: NotificationEmail },
  { path: '/system/notification/feishu', name: 'notify-feishu', component: NotificationFeishu },
  { path: '/system/notification/wecom', name: 'notify-wecom', component: NotificationWecom },
  { path: '/system/notification/webhook', name: 'notify-webhook', component: NotificationWebhook },
  { path: '/system/login-log', name: 'login-log', component: LoginLog },
  { path: '/install', name: 'install', component: Install, meta: { noLogin: true } },
  { path: '/:pathMatch(.*)*', component: NotFound, meta: { noLogin: true } },
]
```

---

## 8. 实现范围

### 8.1 前端页面清单

| 页面 | 路由 | 类型 |
|------|------|------|
| 仪表盘首页 | `/dashboard` | 新建 |
| 任务编辑 | `/task/create`, `/task/edit/:id` | 重写 |
| 任务日志 | `/task/log` | 重写 |
| 任务节点列表 | `/host` | 重写 |
| 任务节点编辑 | `/host/create`, `/host/edit/:id` | 重写 |
| 用户登录 | `/user/login` | 重写 |
| 用户列表 | `/user` | 重写 |
| 用户编辑 | `/user/create`, `/user/edit/:id` | 重写 |
| 修改密码 | `/user/edit-password/:id` | 重写 |
| 修改我的密码 | `/user/edit-my-password` | 重写 |
| 通知设置(邮件) | `/system/notification/email` | 重写 |
| 通知设置(飞书) | `/system/notification/feishu` | 新建 |
| 通知设置(企微) | `/system/notification/wecom` | 新建 |
| 通知设置(Webhook) | `/system/notification/webhook` | 重写 |
| 登录日志 | `/system/login-log` | 重写 |
| 安装 | `/install` | 重写 |

### 8.2 后端变更清单

| 文件 | 变更 |
|------|------|
| `internal/modules/notify/notify.go` | taskType 映射修改 |
| `internal/modules/notify/slack.go` | 删除 |
| `internal/modules/notify/feishu.go` | 新建 |
| `internal/modules/notify/wecom.go` | 新建 |
| `internal/models/task.go` | 新增 request_params 字段 |
| `internal/models/migration.go` | 新增数据库迁移 |
| `internal/routers/task/task.go` | 接口增加请求参数字段 |
| `internal/routers/routers.go` | 通知相关路由更新 |

---

## 9. 不涉及的范围

- 后端框架不迁移（保持 Macaron + Xorm）
- 任务调度核心逻辑不变
- gRPC 节点通信不变
- 邮件通知模块不变
- 现有数据兼容（Slack 通知配置不迁移，用户需重新配置飞书/企微）
