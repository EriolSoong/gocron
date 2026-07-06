# gocron v2.0 全栈重构实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将 gocron 前端从 Vue 2 + Element UI 全量迁移至 Vue 3 + Element Plus + Vite + Pinia，同时实现 UI 现代化、新增仪表盘、cron 实时预览、POST 请求参数配置、飞书/企业微信通知等功能。

**架构：** 后端通知模块重构（Slack→飞书/企微），任务模型新增 request_params 字段；前端用 Vite 新建 Vue 3 项目，逐步重写 16 个页面。后端 Go 代码在现有项目中修改。

**技术栈：** Vue 3 + Element Plus + Vite + Pinia + Vue Router 4（前端）；Go 1.12 + Macaron + Xorm + gRPC（后端）

---

## 文件结构

### 新建前端项目

```
web/vue3/                      # 新项目目录（与旧的 web/vue/ 并存）
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── styles/
│   │   └── global.css         # 全局样式变量 + 设计 tokens
│   ├── router/
│   │   └── index.js           # Vue Router 4 路由
│   ├── stores/
│   │   └── user.js            # Pinia 用户 store
│   ├── utils/
│   │   └── httpClient.js      # Axios 封装
│   ├── api/                   # API 模块
│   │   ├── task.js
│   │   ├── host.js
│   │   ├── user.js
│   │   ├── notification.js
│   │   ├── taskLog.js
│   │   ├── system.js
│   │   └── install.js
│   ├── components/            # 全局组件
│   │   ├── AppHeader.vue
│   │   ├── StatCard.vue
│   │   ├── CronPreview.vue
│   │   └── JsonEditor.vue
│   ├── composables/
│   │   ├── useCron.js
│   │   └── usePagination.js
│   └── pages/
│       ├── dashboard/index.vue
│       ├── task/edit.vue
│       ├── taskLog/list.vue
│       ├── host/list.vue
│       ├── host/edit.vue
│       ├── user/login.vue
│       ├── user/list.vue
│       ├── user/edit.vue
│       ├── user/editPassword.vue
│       ├── user/editMyPassword.vue
│       ├── system/notification/
│       │   ├── email.vue
│       │   ├── feishu.vue
│       │   ├── wecom.vue
│       │   └── webhook.vue
│       ├── loginLog/list.vue
│       └── install/index.vue
```

### 修改的后端文件

```
internal/
├── models/task.go              # + request_params 字段
├── models/migration.go         # + 数据库迁移
├── modules/notify/notify.go    # 修改 taskType 映射
├── modules/notify/slack.go     # 删除
├── modules/notify/feishu.go    # 新建
├── modules/notify/wecom.go     # 新建
├── routers/task/task.go        # + request_params 处理
├── routers/routers.go          # + dashboard stats 路由
├── routers/dashboard.go        # 新建
├── models/setting.go           # + 飞书/企微配置表
└── service/task.go             # + 统计接口
```

---

## 任务分解

### 第一阶段：后端通知模块重构

#### 任务 1：Task 模型 + 数据库迁移

**文件：**
- 修改：`internal/models/task.go`
- 修改：`internal/models/migration.go`

- [ ] **步骤 1：在 Task 结构体中添加 request_params 字段**

编辑 `internal/models/task.go`，在 Command 字段后添加：

```go
RequestParams string `xorm:"TEXT" json:"request_params"` // HTTP POST 请求参数(JSON)
```

- [ ] **步骤 2：添加数据库迁移**

编辑 `internal/models/migration.go`，在 migration 列表中添加：

```go
{
    version: "1.6.0",
    description: "添加任务请求参数字段",
    migrate: func() error {
        _, err := x.Exec("ALTER TABLE task ADD COLUMN request_params TEXT DEFAULT '' AFTER command")
        return err
    },
},
```

- [ ] **步骤 3：编译验证**

运行：`go build ./...`
预期：编译成功，无错误。

- [ ] **步骤 4：Commit**

```bash
git add internal/models/task.go internal/models/migration.go
git commit -m "feat: 任务模型新增 request_params 字段 + 数据库迁移

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

#### 任务 2：重构 notify.go — 修改通知类型映射

**文件：**
- 修改：`internal/modules/notify/notify.go`

- [ ] **步骤 1：修改 notify.go 中的 switch 分支**

将原有的 `case 2: Slack` 改为 `case 2: Feishu`，`case 3: WebHook` 改为 `case 3: WeCom`，新增 `case 4: WebHook`：

```go
switch taskType.(int8) {
case 1:
    // 邮件
    mail := Mail{}
    go mail.Send(msg)
case 2:
    // 飞书
    feishu := Feishu{}
    go feishu.Send(msg)
case 3:
    // 企业微信
    weCom := WeCom{}
    go weCom.Send(msg)
case 4:
    // WebHook
    webHook := WebHook{}
    go webHook.Send(msg)
}
```

- [ ] **步骤 2：编译验证**

运行：`go build ./...`
预期：因 feishu.go 和 wecom.go 尚未创建，编译会报 undefined 错误，这是正常的。

- [ ] **步骤 3：Commit**

```bash
git add internal/modules/notify/notify.go
git commit -m "refactor: 通知类型映射 Slack→飞书, Webhook→企微, 新增 Webhook(4)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

#### 任务 3：删除 slack.go + 更新 setting 模型

**文件：**
- 删除：`internal/modules/notify/slack.go`
- 修改：`internal/models/setting.go`

- [ ] **步骤 1：删除 slack.go**

运行：`git rm internal/modules/notify/slack.go`

- [ ] **步骤 2：更新 setting 模型，添加飞书和企微配置结构体**

编辑 `internal/models/setting.go`，在文件末尾添加：

```go
// 飞书通知配置
type FeishuSetting struct {
    WebhookURL string `json:"webhook_url"`
    Secret     string `json:"secret"` // 签名校验
    Template   string `json:"template"`
    Groups     []FeishuGroup `json:"groups" xorm:"TEXT"` // 群组列表(JSON)
}

type FeishuGroup struct {
    ID      int    `json:"id"`
    Name    string `json:"name"`
    Webhook string `json:"webhook"`
}

// 企业微信通知配置
type WeComSetting struct {
    WebhookURL string `json:"webhook_url"`
    Template   string `json:"template"`
    Groups     []WeComGroup `json:"groups" xorm:"TEXT"`
}

type WeComGroup struct {
    ID      int    `json:"id"`
    Name    string `json:"name"`
    Webhook string `json:"webhook"`
}
```

- [ ] **步骤 3：编译验证**

运行：`go build ./...`
预期：编译会报 feishu/wecom 未定义错误，但 slack 相关错误应已消除。

- [ ] **步骤 4：Commit**

```bash
git add internal/modules/notify/slack.go internal/models/setting.go
git commit -m "refactor: 删除 Slack 通知模块，新增飞书/企微配置模型

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

#### 任务 4：创建飞书通知模块

**文件：**
- 创建：`internal/modules/notify/feishu.go`

- [ ] **步骤 1：创建 feishu.go**

```go
package notify

import (
    "bytes"
    "crypto/hmac"
    "crypto/sha256"
    "encoding/base64"
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"
    "strconv"
    "time"

    "github.com/ouqiang/gocron/internal/models"
    "github.com/ouqiang/gocron/internal/modules/logger"
    "github.com/ouqiang/gocron/internal/modules/setting"
)

type Feishu struct{}

type feishuCard struct {
    Config   feishuConfig   `json:"config"`
    Header   feishuHeader   `json:"header"`
    Elements []feishuElement `json:"elements"`
}

type feishuConfig struct {
    WideScreenMode bool `json:"wide_screen_mode"`
}

type feishuHeader struct {
    Title feishuText `json:"title"`
}

type feishuElement struct {
    Tag     string      `json:"tag"`
    Content interface{} `json:"content,omitempty"`
    Fields  []feishuField `json:"fields,omitempty"`
}

type feishuField struct {
    IsShort bool       `json:"is_short"`
    Text    feishuText `json:"text"`
}

type feishuText struct {
    Tag     string `json:"tag"`
    Content string `json:"content"`
}

type feishuMessage struct {
    MsgType string      `json:"msg_type"`
    Card    feishuCard  `json:"card,omitempty"`
    Content interface{} `json:"content,omitempty"`
}

func (f *Feishu) Send(msg Message) {
    setting := setting.App.Feishu
    if setting.WebhookURL == "" {
        logger.Errorf("飞书Webhook URL未配置")
        return
    }

    content := parseNotifyTemplate(setting.Template, msg)
    
    card := feishuCard{
        Config: feishuConfig{WideScreenMode: true},
        Header: feishuHeader{
            Title: feishuText{Tag: "plain_text", Content: "任务通知"},
        },
        Elements: []feishuElement{
            {
                Tag:     "markdown",
                Content: content,
            },
        },
    }

    body := feishuMessage{
        MsgType: "interactive",
        Card:    card,
    }

    jsonData, err := json.Marshal(body)
    if err != nil {
        logger.Errorf("飞书消息序列化失败: %s", err)
        return
    }

    client := &http.Client{Timeout: 10 * time.Second}
    
    var req *http.Request
    req, err = http.NewRequest("POST", setting.WebhookURL, bytes.NewReader(jsonData))
    if err != nil {
        logger.Errorf("飞书创建请求失败: %s", err)
        return
    }
    req.Header.Set("Content-Type", "application/json")

    // 签名校验
    if setting.Secret != "" {
        timestamp := strconv.FormatInt(time.Now().Unix(), 10)
        sign := genFeishuSign(timestamp, setting.Secret)
        req.Header.Set("X-Lark-Request-Timestamp", timestamp)
        req.Header.Set("X-Lark-Request-Signature", sign)
    }

    resp, err := client.Do(req)
    if err != nil {
        logger.Errorf("飞书发送消息失败: %s", err)
        return
    }
    defer resp.Body.Close()

    respBody, _ := ioutil.ReadAll(resp.Body)
    logger.Debugf("飞书通知响应: %s", string(respBody))
}

func genFeishuSign(timestamp string, secret string) string {
    stringToSign := timestamp + "\n" + secret
    h := hmac.New(sha256.New, []byte(stringToSign))
    h.Write([]byte(""))
    return base64.StdEncoding.EncodeToString(h.Sum(nil))
}
```

- [ ] **步骤 2：编译验证**

运行：`go build ./...`
预期：编译成功（wecom.go 可能仍报错）。

- [ ] **步骤 3：Commit**

```bash
git add internal/modules/notify/feishu.go
git commit -m "feat: 新增飞书机器人通知模块

支持 Webhook URL + Secret 签名校验 + Markdown 卡片消息

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

#### 任务 5：创建企业微信通知模块

**文件：**
- 创建：`internal/modules/notify/wecom.go`

- [ ] **步骤 1：创建 wecom.go**

```go
package notify

import (
    "bytes"
    "encoding/json"
    "io/ioutil"
    "net/http"
    "time"

    "github.com/ouqiang/gocron/internal/modules/logger"
    "github.com/ouqiang/gocron/internal/modules/setting"
)

type WeCom struct{}

type weComMessage struct {
    MsgType  string       `json:"msgtype"`
    Markdown weComMarkdown `json:"markdown,omitempty"`
    Text     *weComText   `json:"text,omitempty"`
}

type weComMarkdown struct {
    Content string `json:"content"`
}

type weComText struct {
    Content string `json:"content"`
}

func (w *WeCom) Send(msg Message) {
    setting := setting.App.WeCom
    if setting.WebhookURL == "" {
        logger.Errorf("企业微信Webhook URL未配置")
        return
    }

    content := parseNotifyTemplate(setting.Template, msg)

    body := weComMessage{
        MsgType:  "markdown",
        Markdown: weComMarkdown{Content: content},
    }

    jsonData, err := json.Marshal(body)
    if err != nil {
        logger.Errorf("企业微信消息序列化失败: %s", err)
        return
    }

    client := &http.Client{Timeout: 10 * time.Second}
    req, err := http.NewRequest("POST", setting.WebhookURL, bytes.NewReader(jsonData))
    if err != nil {
        logger.Errorf("企业微信创建请求失败: %s", err)
        return
    }
    req.Header.Set("Content-Type", "application/json")

    resp, err := client.Do(req)
    if err != nil {
        logger.Errorf("企业微信发送消息失败: %s", err)
        return
    }
    defer resp.Body.Close()

    respBody, _ := ioutil.ReadAll(resp.Body)
    logger.Debugf("企业微信通知响应: %s", string(respBody))
}
```

- [ ] **步骤 2：编译验证**

运行：`go build ./...`
预期：编译成功。

- [ ] **步骤 3：Commit**

```bash
git add internal/modules/notify/wecom.go
git commit -m "feat: 新增企业微信机器人通知模块

支持 Webhook URL + Markdown 消息

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

#### 任务 6：更新 setting 模块加载飞书/企微配置

**文件：**
- 修改：`internal/modules/setting/setting.go`

- [ ] **步骤 1：在 Setting 结构体中添加 Feishu 和 WeCom 字段**

```go
type Setting struct {
    // ... 现有字段
    Feishu models.FeishuSetting `json:"feishu"`
    WeCom  models.WeComSetting  `json:"wecom"`
}
```

- [ ] **步骤 2：添加配置初始化代码（在 init 或 Load 函数中）**

找到配置加载函数，添加飞书和企微配置的默认值：

```go
App.Feishu = models.FeishuSetting{
    WebhookURL: "",
    Secret:     "",
    Template:   defaultNotifyTemplate,
}

App.WeCom = models.WeComSetting{
    WebhookURL: "",
    Template:   defaultNotifyTemplate,
}
```

- [ ] **步骤 3：编译验证**

运行：`go build ./...`
预期：编译成功。

- [ ] **步骤 4：Commit**

```bash
git add internal/modules/setting/setting.go
git commit -m "feat: setting 模块加载飞书/企业微信默认配置

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

#### 任务 7：仪表盘统计 API + 路由

**文件：**
- 新建：`internal/routers/dashboard.go`
- 修改：`internal/routers/routers.go`

- [ ] **步骤 1：创建 dashboard.go 路由文件**

```go
package routers

import (
    "net/http"

    "github.com/ouqiang/gocron/internal/service"
    "gopkg.in/macaron.v1"
)

func DashboardRouter() http.Handler {
    m := macaron.New()
    m.Get("/api/dashboard/stats", dashboardStats)
    return m
}

func dashboardStats(ctx *macaron.Context) {
    stats, err := service.DashboardStats()
    if err != nil {
        ctx.JSON(500, map[string]interface{}{
            "message": err.Error(),
        })
        return
    }
    ctx.JSON(200, stats)
}
```

- [ ] **步骤 2：注册路由**

编辑 `internal/routers/routers.go`，注册 dashboard 路由：

```go
// 在路由注册函数中找到合适位置添加
m.Get("/api/dashboard/stats", dashboard.DashboardStats)
```

- [ ] **步骤 3：创建 service 层统计方法**

新建或修改 `internal/service/task.go`，添加：

```go
type DashboardStats struct {
    TotalTasks     int `json:"total_tasks"`
    ActiveTasks    int `json:"active_tasks"`
    FailedLast24h  int `json:"failed_last_24h"`
    OnlineHosts    int `json:"online_hosts"`
}

func DashboardStats() (*DashboardStats, error) {
    stats := &DashboardStats{}
    
    // 总任务数（主任务）
    total, err := models.Db.Count(&models.Task{Level: 1})
    if err != nil {
        return nil, err
    }
    stats.TotalTasks = int(total)
    
    // 运行中任务
    active, err := models.Db.Where("level = 1 AND status = 1").Count(&models.Task{})
    if err != nil {
        return nil, err
    }
    stats.ActiveTasks = int(active)
    
    // 24h内失败
    failed, err := models.Db.Where("status = 0 AND start_time > NOW() - INTERVAL 24 HOUR").
        Distinct("task_id").Count(&models.TaskLog{})
    if err != nil {
        return nil, err
    }
    stats.FailedLast24h = int(failed)
    
    // 在线节点（这里暂时返回总节点数，后续可通过心跳机制优化）
    hosts, err := models.Db.Count(&models.Host{})
    if err != nil {
        return nil, err
    }
    stats.OnlineHosts = int(hosts)
    
    return stats, nil
}
```

- [ ] **步骤 4：编译验证**

运行：`go build ./...`
预期：编译成功。

- [ ] **步骤 5：Commit**

```bash
git add internal/routers/dashboard.go internal/routers/routers.go internal/service/task.go
git commit -m "feat: 新增仪表盘统计 API 接口

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

#### 任务 8：更新 task 路由支持 request_params

**文件：**
- 修改：`internal/routers/task/task.go`

- [ ] **步骤 1：在任务创建/更新接口中处理 request_params 字段**

找到表单结构体和相关处理函数，添加 `RequestParams` 字段：

```go
type TaskForm struct {
    // ... 现有字段
    RequestParams string `binding:"MaxSize(65535)"` // HTTP POST 请求参数
}
```

在任务保存函数中，将 `form.RequestParams` 赋值给 `task.RequestParams`。

- [ ] **步骤 2：编译验证**

运行：`go build ./...`
预期：编译成功。

- [ ] **步骤 3：Commit**

```bash
git add internal/routers/task/task.go
git commit -m "feat: 任务编辑接口支持 request_params 字段

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### 第二阶段：前端重构（Vue 3 + Element Plus）

#### 任务 9：初始化 Vue 3 + Vite 项目

**文件：**
- 新建：`web/vue3/package.json`
- 新建：`web/vue3/vite.config.js`
- 新建：`web/vue3/index.html`
- 新建：`web/vue3/src/main.js`
- 新建：`web/vue3/src/App.vue`
- 新建：`web/vue3/src/styles/global.css`
- 新建：`web/vue3/src/utils/httpClient.js`
- 新建：`web/vue3/src/stores/user.js`
- 新建：`web/vue3/src/router/index.js`
- 新建：`web/vue3/src/api/*.js`（API 模块）

- [ ] **步骤 1：创建 package.json**

```json
{
  "name": "gocron-vue3",
  "version": "2.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.3.0",
    "pinia": "^2.1.0",
    "element-plus": "^2.5.0",
    "@element-plus/icons-vue": "^2.3.0",
    "axios": "^1.6.0",
    "cron-parser": "^4.9.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.1.0"
  }
}
```

- [ ] **步骤 2：创建 vite.config.js**

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:5920',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **步骤 3：创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>gocron - 定时任务管理系统</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **步骤 4：创建 src/main.js**

```js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import './styles/global.css'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: /* 可添加中文语言包 */ })
app.mount('#app')
```

- [ ] **步骤 5：创建 src/styles/global.css**

```css
:root {
  --color-primary: #4f46e5;
  --color-primary-light: #e0e7ff;
  --color-success: #10b981;
  --color-warning: #d97706;
  --color-danger: #ef4444;
  --color-info: #0ea5e9;
  --color-text-primary: #1a1a2e;
  --color-text-secondary: #666;
  --color-text-muted: #999;
  --color-background: #f8f9fb;
  --color-surface: #ffffff;
  --color-border: #f0f0f0;
  --radius-card: 12px;
  --radius-base: 8px;
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.04);
  --shadow-dialog: 0 20px 60px rgba(0, 0, 0, 0.15);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--color-background);
  color: var(--color-text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Element Plus 全局覆盖 */
.el-button {
  border-radius: var(--radius-base);
}

.el-card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.el-table {
  border-radius: var(--radius-card);
}

.el-input__wrapper {
  border-radius: var(--radius-base);
}
```

- [ ] **步骤 6：创建 API 模块（以 task.js 为例，其他类似）**

```js
// src/api/task.js
import request from '@/utils/httpClient'

export default {
  list(params, callback) {
    request.get('/api/task', { params }).then(res => callback(res.data))
  },
  detail(id, callback) {
    request.get(`/api/task/${id}`).then(res => callback(res.data, res.hosts))
  },
  update(form, callback) {
    request.post('/api/task/update', form).then(() => callback())
  },
  run(id, callback) {
    request.post('/api/task/run', { id }).then(() => callback())
  },
  remove(id, callback) {
    request.post('/api/task/remove', { id }).then(() => callback())
  },
  enable(id) {
    request.post('/api/task/enable', { id })
  },
  disable(id) {
    request.post('/api/task/disable', { id })
  },
}
```

- [ ] **步骤 7：创建 httpClient.js**

```js
import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  timeout: 30000,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
})

request.interceptors.response.use(
  response => {
    const data = response.data
    if (data.code === 200 || data.message === '') {
      return data
    }
    ElMessage.error(data.message || '请求失败')
    return Promise.reject(data)
  },
  error => {
    if (error.response && error.response.status === 401) {
      window.location.href = '/user/login'
      return Promise.reject(error)
    }
    ElMessage.error(error.message || '网络错误')
    return Promise.reject(error)
  }
)

export default request
```

- [ ] **步骤 8：创建 store/user.js**

```js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const uid = ref(0)
  const username = ref('')
  const isAdmin = ref(false)

  const isLoggedIn = computed(() => !!token.value)

  function setUser(user) {
    token.value = user.token
    uid.value = user.uid
    username.value = user.username
    isAdmin.value = user.is_admin
    localStorage.setItem('gocron_user', JSON.stringify(user))
  }

  function loadFromStorage() {
    const saved = localStorage.getItem('gocron_user')
    if (saved) {
      try {
        const user = JSON.parse(saved)
        setUser(user)
      } catch (e) { /* ignore */ }
    }
  }

  function logout() {
    token.value = ''
    uid.value = 0
    username.value = ''
    isAdmin.value = false
    localStorage.removeItem('gocron_user')
  }

  loadFromStorage()

  return { token, uid, username, isAdmin, isLoggedIn, setUser, logout }
})
```

- [ ] **步骤 8：创建 router/index.js**

按照设计规格中的路由表创建路由（导入页面组件时先创建空组件）。

- [ ] **步骤 9：安装依赖并验证构建**

```bash
cd web/vue3 && npm install && npm run build
```

预期：构建成功，输出到 dist/ 目录。

- [ ] **步骤 10：Commit**

```bash
git add web/vue3/
git commit -m "feat: 初始化 Vue 3 + Vite + Element Plus 前端项目脚手架

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

#### 任务 10：创建 App.vue + AppHeader + 全局组件

**文件：**
- 修改：`web/vue3/src/App.vue`
- 新建：`web/vue3/src/components/AppHeader.vue`
- 新建：`web/vue3/src/components/StatCard.vue`

- [ ] **步骤 1：App.vue**

```vue
<template>
  <div id="gocron-app">
    <AppHeader v-if="showHeader" />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'

const route = useRoute()
const showHeader = computed(() => !route.meta?.noLogin)
</script>

<style scoped>
.main-content {
  min-height: calc(100vh - 60px);
}
</style>
```

- [ ] **步骤 2：AppHeader.vue**

```vue
<template>
  <header class="app-header">
    <div class="header-inner">
      <div class="header-left">
        <span class="logo">⚡ gocron</span>
        <nav class="nav-links">
          <router-link to="/dashboard" class="nav-link"
            :class="{ active: $route.path.startsWith('/dashboard') || $route.path.startsWith('/task') }">
            任务管理
          </router-link>
          <router-link to="/host" class="nav-link"
            :class="{ active: $route.path.startsWith('/host') }">
            任务节点
          </router-link>
          <router-link v-if="userStore.isAdmin" to="/user" class="nav-link"
            :class="{ active: $route.path.startsWith('/user') && !$route.path.includes('/login') }">
            用户管理
          </router-link>
          <router-link v-if="userStore.isAdmin" to="/system/notification/email" class="nav-link"
            :class="{ active: $route.path.startsWith('/system') }">
            系统管理
          </router-link>
        </nav>
      </div>
      <div class="header-right">
        <el-dropdown trigger="click" @command="handleCommand">
          <span class="user-info">
            <el-avatar :size="32" style="background: var(--color-primary);">
              {{ userStore.username?.charAt(0)?.toUpperCase() }}
            </el-avatar>
            <span class="username">{{ userStore.username }}</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="password">
                <el-icon><Lock /></el-icon> 修改密码
              </el-dropdown-item>
              <el-dropdown-item command="logout" divided>
                <el-icon><SwitchButton /></el-icon> 退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

function handleCommand(command) {
  if (command === 'password') {
    router.push('/user/edit-my-password')
  } else if (command === 'logout') {
    userStore.logout()
    router.push('/user/login')
  }
}
</script>

<style scoped>
.app-header {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 40px;
}

.logo {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-primary);
}

.nav-links {
  display: flex;
  gap: 4px;
}

.nav-link {
  padding: 0 16px;
  height: 60px;
  line-height: 60px;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 14px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.nav-link:hover {
  color: var(--color-primary);
}

.nav-link.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-base);
  transition: background 0.2s;
}

.user-info:hover {
  background: var(--color-background);
}

.username {
  font-size: 14px;
  color: var(--color-text-primary);
}
</style>
```

- [ ] **步骤 3：StatCard.vue**

```vue
<template>
  <div class="stat-card" @click="$emit('click')" :style="{ cursor: clickable ? 'pointer' : 'default' }">
    <div class="stat-icon" :style="{ background: iconBg }">
      <span class="icon">{{ icon }}</span>
    </div>
    <div class="stat-info">
      <div class="stat-label">{{ label }}</div>
      <div class="stat-value" :style="{ color: valueColor }">{{ value }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: { type: String, default: '📋' },
  label: { type: String, required: true },
  value: { type: [Number, String], default: 0 },
  color: { type: String, default: 'primary' },
})

defineEmits(['click'])

const colorMap = {
  primary: { bg: '#e0e7ff', text: '#4f46e5' },
  success: { bg: '#d1fae5', text: '#10b981' },
  danger: { bg: '#fee2e2', text: '#ef4444' },
  info: { bg: '#e0f2fe', text: '#0ea5e9' },
}

const iconBg = computed(() => colorMap[props.color]?.bg || '#e0e7ff')
const valueColor = computed(() => colorMap[props.color]?.text || '#4f46e5')
const clickable = computed(() => {
  const emit = defineEmits(['click'])
  return true
})
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--color-surface);
  border-radius: var(--radius-card);
  padding: 20px 24px;
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.2s, transform 0.2s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 2px;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
}
</style>
```

- [ ] **步骤 4：构建验证**

运行：`cd web/vue3 && npm run build`
预期：构建成功。

- [ ] **步骤 5：Commit**

```bash
git add web/vue3/src/App.vue web/vue3/src/components/AppHeader.vue web/vue3/src/components/StatCard.vue
git commit -m "feat: 创建 App 框架、顶部导航栏和统计卡片组件

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

#### 任务 11：仪表盘首页

**文件：**
- 新建：`web/vue3/src/pages/dashboard/index.vue`

- [ ] **步骤 1：创建仪表盘页面**

```vue
<template>
  <div class="dashboard-container">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <StatCard icon="📋" label="总任务数" :value="stats.total_tasks" color="primary" />
      <StatCard icon="✅" label="运行中" :value="stats.active_tasks" color="success" />
      <StatCard icon="❌" label="失败(24h)" :value="stats.failed_last_24h" color="danger" />
      <StatCard icon="🖥" label="在线节点" :value="stats.online_hosts" color="info" />
    </div>

    <!-- 任务列表卡片 -->
    <div class="task-section">
      <div class="section-header">
        <div class="search-bar">
          <el-input
            v-model="searchParams.name"
            placeholder="搜索任务名称、标签、ID..."
            clearable
            :prefix-icon="Search"
            @keyup.enter="search"
          />
          <el-select v-model="searchParams.protocol" placeholder="执行方式" clearable style="width: 130px;">
            <el-option label="全部" value="" />
            <el-option label="HTTP" value="1" />
            <el-option label="Shell" value="2" />
          </el-select>
          <el-select v-model="searchParams.status" placeholder="状态" clearable style="width: 120px;">
            <el-option label="全部" value="" />
            <el-option label="激活" value="2" />
            <el-option label="停止" value="1" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="search">搜索</el-button>
        </div>
        <div class="action-bar">
          <el-button v-if="userStore.isAdmin" type="primary" @click="toCreate">
            <el-icon><Plus /></el-icon> 新增任务
          </el-button>
          <el-button @click="refresh" :icon="Refresh">刷新</el-button>
        </div>
      </div>

      <el-table :data="tasks" style="width: 100%" @expand-change="handleExpand" v-loading="loading">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-info">
              <el-descriptions :column="2" size="small" border>
                <el-descriptions-item label="创建时间">{{ formatTime(row.created) }}</el-descriptions-item>
                <el-descriptions-item label="任务类型">{{ row.level === 1 ? '主任务' : '子任务' }}</el-descriptions-item>
                <el-descriptions-item label="超时时间">{{ row.timeout > 0 ? row.timeout + '秒' : '不限制' }}</el-descriptions-item>
                <el-descriptions-item label="重试次数">{{ row.retry_times }}</el-descriptions-item>
                <el-descriptions-item label="重试间隔">{{ row.retry_interval > 0 ? row.retry_interval + '秒' : '系统默认' }}</el-descriptions-item>
                <el-descriptions-item label="命令" :span="2">
                  <pre class="command-text">{{ row.command }}</pre>
                </el-descriptions-item>
                <el-descriptions-item v-if="row.remark" label="备注" :span="2">{{ row.remark }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="任务名称" min-width="150">
          <template #default="{ row }">
            <span class="task-name">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="标签" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.tag" size="small" effect="plain" color="#e0e7ff" style="color:#4f46e5;border:none;">
              {{ row.tag }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="spec" label="cron" width="120" />
        <el-table-column label="执行方式" width="100">
          <template #default="{ row }">
            {{ formatProtocol(row) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <span v-if="row.status === 1" class="status-dot active">● 运行中</span>
            <span v-else class="status-dot inactive">● 已停止</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="runTask(row)">执行</el-button>
            <el-button text type="primary" size="small" @click="toEdit(row)">编辑</el-button>
            <el-button text type="primary" size="small" @click="jumpToLog(row)">日志</el-button>
            <el-popconfirm title="确定删除此任务?" @confirm="remove(row)">
              <template #reference>
                <el-button text type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="searchParams.page"
          v-model:page-size="searchParams.page_size"
          :total="taskTotal"
          :page-sizes="[20, 50, 100]"
          layout="sizes, prev, pager, next, total"
          background
          @change="search"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import StatCard from '@/components/StatCard.vue'
import taskService from '@/api/task'

const router = useRouter()
const userStore = useUserStore()

const tasks = ref([])
const taskTotal = ref(0)
const loading = ref(false)
const stats = reactive({
  total_tasks: 0,
  active_tasks: 0,
  failed_last_24h: 0,
  online_hosts: 0,
})
const searchParams = reactive({
  page: 1,
  page_size: 20,
  id: '',
  name: '',
  protocol: '',
  status: '',
  tag: '',
  host_id: '',
})

onMounted(() => {
  loadStats()
  search()
})

function loadStats() {
  // 从 API 获取统计（暂时 hardcode 后续替换）
  // taskService.stats().then(res => Object.assign(stats, res))
}

function search() {
  loading.value = true
  taskService.list({ ...searchParams }, (res) => {
    tasks.value = res.data
    taskTotal.value = res.total
    loading.value = false
  })
}

function formatProtocol(row) {
  if (row.protocol === 2) return 'shell'
  return row.http_method === 1 ? 'http-get' : 'http-post'
}

function formatTime(time) {
  if (!time) return ''
  const d = new Date(time)
  const pad = n => n >= 10 ? n : '0' + n
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function refresh() {
  search()
  ElMessage.success('刷新成功')
}

function toCreate() {
  router.push('/task/create')
}

function toEdit(row) {
  router.push(`/task/edit/${row.id}`)
}

function runTask(row) {
  taskService.run(row.id, () => ElMessage.success('任务已开始执行'))
}

function remove(row) {
  taskService.remove(row.id, () => search())
}

function jumpToLog(row) {
  router.push(`/task/log?task_id=${row.id}`)
}
</script>

<style scoped>
.dashboard-container {
  padding: 28px 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.task-section {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  padding: 20px;
  box-shadow: var(--shadow-card);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.action-bar {
  display: flex;
  gap: 8px;
}

.task-name {
  font-weight: 500;
  color: var(--color-text-primary);
}

.status-dot {
  font-size: 13px;
}

.status-dot.active {
  color: var(--color-success);
}

.status-dot.inactive {
  color: var(--color-danger);
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.expand-info {
  padding: 16px;
}

.command-text {
  background: #1e1e2e;
  color: #cdd6f4;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  font-family: 'SF Mono', Monaco, monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 200px;
  overflow-y: auto;
}
</style>
```

- [ ] **步骤 2：构建验证**

运行：`cd web/vue3 && npm run build`
预期：构建成功。

- [ ] **步骤 3：Commit**

```bash
git add web/vue3/src/pages/dashboard/
git commit -m "feat: 创建仪表盘首页（统计卡片 + 任务列表整合）

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

#### 任务 12：用户登录页

**文件：**
- 新建：`web/vue3/src/pages/user/login.vue`

- [ ] **步骤 1：创建登录页**

```vue
<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="login-logo">⚡</div>
        <h1 class="login-title">gocron</h1>
        <p class="login-subtitle">定时任务管理系统</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="submit">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名或邮箱"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" size="large" :loading="loading" class="login-btn">
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">gocron v2.0</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import userService from '@/api/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

function submit() {
  formRef.value?.validate(valid => {
    if (!valid) return
    loading.value = true
    userService.login(form.username, form.password, (data) => {
      userStore.setUser({
        token: data.token,
        uid: data.uid,
        username: data.username,
        is_admin: data.is_admin,
      })
      ElMessage.success('登录成功')
      router.push(route.query.redirect || '/dashboard')
    }).finally(() => { loading.value = false })
  })
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: #fff;
  border-radius: 16px;
  padding: 48px 40px;
  width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 36px;
}

.login-logo {
  font-size: 36px;
  margin-bottom: 8px;
}

.login-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0;
}

.login-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.login-btn {
  width: 100%;
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 12px;
  color: #bbb;
}
</style>
```

- [ ] **步骤 2：Commit**

```bash
git add web/vue3/src/pages/user/login.vue
git commit -m "feat: 创建独立全屏登录页

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

#### 任务 13：CronPreview 组件 + 任务编辑/创建页

**文件：**
- 新建：`web/vue3/src/composables/useCron.js`
- 新建：`web/vue3/src/components/CronPreview.vue`
- 新建：`web/vue3/src/components/JsonEditor.vue`
- 新建：`web/vue3/src/pages/task/edit.vue`

- [ ] **步骤 1：创建 useCron composable**

```js
// src/composables/useCron.js
import { ref, watch } from 'vue'
import parser from 'cron-parser'

export function useCron(specRef) {
  const nextRun = ref('')
  const nextRuns = ref([])
  const error = ref('')

  function updatePreview(expression) {
    error.value = ''
    nextRun.value = ''
    nextRuns.value = []

    if (!expression || expression.trim() === '') {
      return
    }

    try {
      const interval = parser.parseExpression(expression.trim())
      nextRun.value = interval.next().toISOString().replace('T', ' ').slice(0, 19)
      
      const runs = []
      for (let i = 0; i < 5; i++) {
        runs.push(interval.next().toISOString().replace('T', ' ').slice(0, 19))
      }
      nextRuns.value = runs
    } catch (e) {
      error.value = e.message
    }
  }

  return { nextRun, nextRuns, error, updatePreview }
}
```

- [ ] **步骤 2：创建 CronPreview.vue 组件**

```vue
<template>
  <div v-if="spec" class="cron-preview" :class="{ 'is-valid': !error && nextRun, 'is-error': error }">
    <div v-if="error" class="preview-error">
      <el-icon><WarningFilled /></el-icon>
      <span>表达式无效：{{ error }}</span>
    </div>
    <div v-else-if="nextRun" class="preview-valid">
      <div class="preview-main">
        <span class="preview-icon">⏱️</span>
        <div>
          <div class="preview-label">下次执行时间</div>
          <div class="preview-time">{{ nextRun }}</div>
        </div>
      </div>
      <div class="preview-future">
        <div class="preview-label">后续 {{ nextRuns.length }} 次</div>
        <div class="preview-list">
          <div v-for="(time, i) in nextRuns" :key="i" class="preview-item">{{ time }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { WarningFilled } from '@element-plus/icons-vue'
import { useCron } from '@/composables/useCron'

const props = defineProps({
  spec: { type: String, default: '' },
})

const { nextRun, nextRuns, error, updatePreview } = useCron()

watch(() => props.spec, (val) => {
  if (val) {
    updatePreview(val)
  }
}, { immediate: true })
</script>

<style scoped>
.cron-preview {
  border-radius: 10px;
  padding: 14px 18px;
  margin-bottom: 16px;
}

.cron-preview.is-valid {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.cron-preview.is-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.preview-valid {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.preview-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-icon {
  font-size: 20px;
}

.preview-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.preview-time {
  font-size: 18px;
  font-weight: 700;
  color: #16a34a;
  font-family: 'SF Mono', Monaco, monospace;
}

.preview-list {
  font-size: 12px;
  color: #555;
  font-family: monospace;
  line-height: 1.8;
}

.preview-error {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #dc2626;
  font-size: 13px;
}
</style>
```

- [ ] **步骤 3：创建任务编辑页**

创建 `web/vue3/src/pages/task/edit.vue`，这是一个复杂的表单页面，包含：
- 基本信息（名称、标签、类型、依赖）
- 调度配置（cron 输入 + CronPreview 组件）
- 执行配置（执行方式、请求方法、URL/命令）
- HTTP POST 请求参数区域（JSON/表单双模式，使用 JsonEditor）
- 高级配置（超时、单实例、重试）
- 通知配置
- 保存/取消按钮

```vue
<template>
  <div class="task-edit-container">
    <div class="edit-card">
      <h2 class="page-title">{{ isEdit ? '编辑任务' : '创建任务' }}</h2>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" label-position="top">
        <!-- 基本信息 -->
        <div class="form-section">
          <div class="section-title">基本信息</div>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="任务名称" prop="name">
                <el-input v-model="form.name" placeholder="请输入任务名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="标签">
                <el-input v-model="form.tag" placeholder="通过标签将任务分组" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="8">
              <el-form-item label="任务类型">
                <el-select v-model="form.level" :disabled="!!form.id" style="width:100%">
                  <el-option label="主任务" :value="1" />
                  <el-option label="子任务" :value="2" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col v-if="form.level === 1" :span="8">
              <el-form-item label="依赖关系">
                <el-select v-model="form.dependency_status" style="width:100%">
                  <el-option label="强依赖" :value="1" />
                  <el-option label="弱依赖" :value="2" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col v-if="form.level === 1" :span="8">
              <el-form-item label="子任务ID">
                <el-input v-model="form.dependency_task_id" placeholder="多个ID逗号分隔" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 调度配置 -->
        <div class="form-section">
          <div class="section-title">调度配置</div>
          <el-form-item v-if="form.level === 1" label="crontab 表达式" prop="spec">
            <el-input v-model="form.spec" placeholder="秒 分 时 天 月 周" />
            <CronPreview :spec="form.spec" />
          </el-form-item>
        </div>

        <!-- 执行配置 -->
        <div class="form-section">
          <div class="section-title">执行配置</div>
          <el-row :gutter="24">
            <el-col :span="8">
              <el-form-item label="执行方式">
                <el-select v-model="form.protocol" style="width:100%">
                  <el-option label="HTTP" :value="1" />
                  <el-option label="Shell" :value="2" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col v-if="form.protocol === 1" :span="8">
              <el-form-item label="请求方法">
                <el-select v-model="form.http_method" style="width:100%">
                  <el-option label="GET" :value="1" />
                  <el-option label="POST" :value="2" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col v-if="form.protocol === 2" :span="16">
              <el-form-item label="任务节点">
                <el-select v-model="selectedHosts" multiple filterable placeholder="请选择" style="width:100%">
                  <el-option v-for="h in hosts" :key="h.id" :label="`${h.alias} - ${h.name}`" :value="h.id" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="命令/URL" prop="command">
            <el-input v-model="form.command" :rows="form.protocol === 1 ? 1 : 4" type="textarea" :placeholder="commandPlaceholder" />
          </el-form-item>

          <!-- HTTP POST 请求参数 -->
          <div v-if="form.protocol === 1 && form.http_method === 2" class="request-params-section">
            <div class="params-header">
              <span class="params-title">📦 请求参数</span>
              <div class="params-mode">
                <el-radio-group v-model="paramMode" size="small">
                  <el-radio-button value="json">JSON 文本</el-radio-button>
                  <el-radio-button value="form">表单模式</el-radio-button>
                </el-radio-group>
              </div>
            </div>

            <!-- JSON 文本模式 -->
            <div v-if="paramMode === 'json'">
              <div class="json-editor">
                <div class="editor-toolbar">
                  <el-button size="small" text @click="formatJson">📋 格式化</el-button>
                </div>
                <el-input
                  v-model="jsonText"
                  type="textarea"
                  :rows="8"
                  placeholder='{"key": "value"}'
                  style="font-family: monospace;"
                />
              </div>
              <div class="params-info">
                Content-Type: application/json | 支持直接粘贴 JSON 文本，保存时自动校验
              </div>
            </div>

            <!-- 表单模式 -->
            <div v-else>
              <div class="form-params">
                <div class="form-params-header">
                  <el-tag size="small">Headers</el-tag>
                </div>
                <el-row v-for="(header, i) in headers" :key="'h'+i" :gutter="8" class="param-row">
                  <el-col :span="10">
                    <el-input v-model="header.key" placeholder="Header名" size="small" />
                  </el-col>
                  <el-col :span="10">
                    <el-input v-model="header.value" placeholder="Header值" size="small" />
                  </el-col>
                  <el-col :span="4">
                    <el-button text type="danger" size="small" @click="headers.splice(i, 1)">✕</el-button>
                  </el-col>
                </el-row>
                <el-button text type="primary" size="small" @click="headers.push({key:'', value:''})">+ 添加 Header</el-button>

                <div class="form-params-header" style="margin-top:12px;">
                  <el-tag size="small">Body</el-tag>
                  <el-radio-group v-model="bodyType" size="small" style="margin-left:8px;">
                    <el-radio-button value="json">JSON</el-radio-button>
                    <el-radio-button value="form-data">Form-Data</el-radio-button>
                    <el-radio-button value="urlencoded">x-www-form-urlencoded</el-radio-button>
                  </el-radio-group>
                </div>
                <el-row v-for="(param, i) in formParams" :key="'p'+i" :gutter="8" class="param-row">
                  <el-col :span="10">
                    <el-input v-model="param.key" placeholder="参数名" size="small" />
                  </el-col>
                  <el-col :span="10">
                    <el-input v-model="param.value" placeholder="参数值" size="small" />
                  </el-col>
                  <el-col :span="4">
                    <el-button text type="danger" size="small" @click="formParams.splice(i, 1)">✕</el-button>
                  </el-col>
                </el-row>
                <el-button text type="primary" size="small" @click="formParams.push({key:'', value:''})">+ 添加参数</el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 高级配置 -->
        <div class="form-section">
          <div class="section-title">高级配置</div>
          <el-alert title="任务执行超时强制结束, 取值0-86400(秒), 默认0, 不限制" type="info" :closable="false" show-icon style="margin-bottom:12px" />
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="超时时间(秒)" prop="timeout">
                <el-input v-model.number="form.timeout" placeholder="0-86400" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="单实例运行">
                <el-select v-model="form.multi" style="width:100%">
                  <el-option label="是" :value="2" />
                  <el-option label="否" :value="1" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="失败重试次数" prop="retry_times">
                <el-input v-model.number="form.retry_times" placeholder="0-10, 默认0不重试" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="重试间隔(秒)" prop="retry_interval">
                <el-input v-model.number="form.retry_interval" placeholder="0-3600" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 通知配置 -->
        <div class="form-section">
          <div class="section-title">通知配置</div>
          <el-row :gutter="24">
            <el-col :span="8">
              <el-form-item label="通知状态">
                <el-select v-model="form.notify_status" style="width:100%">
                  <el-option label="不通知" :value="1" />
                  <el-option label="失败通知" :value="2" />
                  <el-option label="总是通知" :value="3" />
                  <el-option label="关键字匹配通知" :value="4" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col v-if="form.notify_status > 1" :span="8">
              <el-form-item label="通知类型">
                <el-select v-model="form.notify_type" style="width:100%">
                  <el-option label="邮件" :value="2" />
                  <el-option label="飞书" :value="3" />
                  <el-option label="企业微信" :value="4" />
                  <el-option label="WebHook" :value="5" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item v-if="form.notify_status === 4" label="关键字" prop="notify_keyword">
            <el-input v-model="form.notify_keyword" placeholder="任务输出中包含此关键字将触发通知" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" :rows="3" />
          </el-form-item>
        </div>

        <div class="form-actions">
          <el-button type="primary" @click="submit" :loading="submitting">保存</el-button>
          <el-button @click="cancel">取消</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import CronPreview from '@/components/CronPreview.vue'
import taskService from '@/api/task'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)
const submitting = ref(false)
const isEdit = computed(() => !!route.params.id)

const form = reactive({
  id: '',
  name: '',
  tag: '',
  level: 1,
  dependency_status: 1,
  dependency_task_id: '',
  spec: '',
  protocol: 2,
  http_method: 1,
  command: '',
  host_id: '',
  timeout: 0,
  multi: 2,
  notify_status: 1,
  notify_type: 2,
  notify_receiver_id: '',
  notify_keyword: '',
  retry_times: 0,
  retry_interval: 0,
  remark: '',
  request_params: '',
})

const rules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  spec: [{ required: true, message: '请输入crontab表达式', trigger: 'blur' }],
  command: [{ required: true, message: '请输入命令', trigger: 'blur' }],
  timeout: [{ type: 'number', message: '请输入有效数字', trigger: 'blur' }],
  retry_times: [{ type: 'number', message: '请输入有效数字', trigger: 'blur' }],
  retry_interval: [{ type: 'number', message: '请输入有效数字', trigger: 'blur' }],
}

const hosts = ref([])
const selectedHosts = ref([])
const paramMode = ref('json')
const jsonText = ref('')
const headers = ref([{ key: 'Content-Type', value: 'application/json' }])
const formParams = ref([{ key: '', value: '' }])
const bodyType = ref('json')

const commandPlaceholder = computed(() => {
  return form.protocol === 1 ? '请输入URL地址' : '请输入shell命令'
})

onMounted(() => {
  const id = route.params.id
  if (id) {
    taskService.detail(id, (taskData, hostsData) => {
      hosts.value = hostsData || []
      if (taskData) {
        Object.assign(form, taskData)
        form.multi = taskData.multi ? 2 : 1
        form.notify_status = taskData.notify_status + 1
        if (taskData.request_params) {
          jsonText.value = taskData.request_params
        }
      }
    })
  }
})

function submit() {
  formRef.value?.validate(valid => {
    if (!valid) return

    // 如果是 HTTP POST 且有请求参数
    if (form.protocol === 1 && form.http_method === 2) {
      if (paramMode.value === 'json') {
        try {
          JSON.parse(jsonText.value)
          form.request_params = jsonText.value
        } catch (e) {
          ElMessage.error('JSON 格式无效：' + e.message)
          return
        }
      } else {
        // 表单模式构建 JSON
        const paramsObj = {}
        formParams.value.forEach(p => {
          if (p.key) paramsObj[p.key] = p.value
        })
        form.request_params = JSON.stringify(paramsObj)
      }
    }

    submitting.value = true
    form.host_id = selectedHosts.value.join(',')
    taskService.update({ ...form }, () => {
      ElMessage.success('保存成功')
      router.push('/dashboard')
    }).finally(() => { submitting.value = false })
  })
}

function cancel() {
  router.push('/dashboard')
}

function formatJson() {
  try {
    jsonText.value = JSON.stringify(JSON.parse(jsonText.value), null, 2)
  } catch (e) {
    ElMessage.warning('JSON 格式无效')
  }
}
</script>

<style scoped>
.task-edit-container {
  padding: 28px 32px;
  max-width: 960px;
  margin: 0 auto;
}

.edit-card {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  padding: 28px 32px;
  box-shadow: var(--shadow-card);
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 24px;
  color: var(--color-text-primary);
}

.form-section {
  margin-bottom: 28px;
  padding-bottom: 28px;
  border-bottom: 1px solid var(--color-border);
}

.form-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  font-size: 13px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 16px;
  font-weight: 600;
}

.request-params-section {
  background: #fafafa;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 18px;
  margin-top: 12px;
}

.params-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.params-title {
  font-weight: 600;
  font-size: 14px;
}

.params-info {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 8px;
}

.form-params-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.param-row {
  margin-bottom: 6px;
}

.json-editor {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.editor-toolbar {
  background: #f5f5f5;
  padding: 4px 8px;
  border-bottom: 1px solid #e5e7eb;
}

.form-actions {
  border-top: 1px solid var(--color-border);
  padding-top: 20px;
  display: flex;
  gap: 12px;
}
</style>
```

**注意：** 此处为概要代码。实际实现时，确保所有 select 的 v-model 使用正确的 reactive 对象，并处理编辑模式下已有的数据回填（如 hosts、notify 接收人等）。

- [ ] **步骤 2：Commit**

```bash
git add web/vue3/src/composables/ web/vue3/src/components/CronPreview.vue web/vue3/src/pages/task/
git commit -m "feat: 创建任务编辑/创建页（cron 实时预览 + HTTP POST 请求参数配置）

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

#### 任务 14～20：剩余页面创建

按类似模式创建剩余页面。参考设计规格确保：
- 所有页面使用顶部导航（不需要侧边栏组件）
- 符合全局设计规范（配色、间距、圆角）
- 保持一致的交互风格

| 任务 | 页面 | 文件路径 |
|------|------|----------|
| 14 | 任务日志 | `web/vue3/src/pages/taskLog/list.vue` |
| 15 | 任务节点列表 + 编辑 | `web/vue3/src/pages/host/list.vue`, `edit.vue` |
| 16 | 用户列表 + 编辑 + 密码 | `web/vue3/src/pages/user/list.vue`, `edit.vue`, `editPassword.vue`, `editMyPassword.vue` |
| 17 | 通知设置(邮件/飞书/企微/Webhook) | `web/vue3/src/pages/system/notification/*.vue` |
| 18 | 登录日志 | `web/vue3/src/pages/loginLog/list.vue` |
| 19 | 安装页 | `web/vue3/src/pages/install/index.vue` |
| 20 | 404 页面 | `web/vue3/src/components/NotFound.vue` |

每个任务的步骤：创建组件文件 → 构建验证 → commit。

---

### 第三阶段：集成与验证

#### 任务 21：静态资源整合

**文件：**
- 修改：`makefile`
- 创建：`web/vue3/build.sh`

- [ ] **步骤 1：创建构建脚本**

```bash
#!/bin/bash
# web/vue3/build.sh - 构建 Vue 3 前端
cd "$(dirname "$0")"
npm install --silent
npm run build
# 将构建输出复制到 Go 嵌入目录或保留在原位
```

- [ ] **步骤 2：更新 makefile**

添加 vue3 构建命令：

```makefile
build-vue3:
    cd web/vue3 && npm run build

run-vue3:
    cd web/vue3 && npm run dev
```

- [ ] **步骤 3：Commit**

```bash
git add web/vue3/build.sh makefile
git commit -m "chore: 添加 Vue 3 前端构建脚本

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

#### 任务 22：完整构建验证

- [ ] **步骤 1：Go 编译验证**

```bash
cd /Users/soong/PC/03_Projects/Code/golang/gocron/.claude/worktrees/gocron-v2-redesign
go build ./...
```

预期：所有 Go 包编译成功。

- [ ] **步骤 2：前端构建验证**

```bash
cd web/vue3 && npm run build
```

预期：Vite 构建成功，输出到 dist/。

- [ ] **步骤 3：综合检查**

确认无遗漏文件，全部 commit。

- [ ] **步骤 4：最终 Commit**

```bash
git add -A
git commit -m "chore: v2.0 完整构建验证通过

Co-Authored-By: Claude <noreply@anthropic.com>"
```
