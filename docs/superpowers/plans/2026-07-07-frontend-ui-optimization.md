# 前端 UI 优化 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 统一页面宽度、优化任务展开行卡片式展示、实现移动端全面响应式适配

**架构：** 在现有 Vue 3 + Element Plus 项目中，通过全局 CSS 工具类和媒体查询实现响应式。新建 TaskDetail 组件替换扁平描述列表。AppHeader 增加 el-drawer 汉堡菜单。不引入新依赖。

**技术栈：** Vue 3 (Composition API / `<script setup>`), Element Plus 2.5, Vite 5

---

### 任务 1：全局 CSS 基础设施

**文件：**
- 修改：`web/vue3/src/styles/global.css`

- [ ] **步骤 1：添加断点变量、工具类和基础媒体查询**

```css
:root {
  /* 现有变量保持不变 */
  --color-primary: #4f46e5;
  --color-primary-light: #e0e7ff;
  --color-success: #10b981;
  --color-danger: #ef4444;
  --color-warning: #d97706;
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
  /* 新增：断点 */
  --bp-tablet: 1024px;
  --bp-mobile: 768px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--color-background);
  color: var(--color-text-primary);
  -webkit-font-smoothing: antialiased;
}

/* Element Plus 基础覆盖 */
.el-button { border-radius: var(--radius-base); }
.el-table { border-radius: var(--radius-card); }
.el-input__wrapper { border-radius: var(--radius-base); }

/* === 页面宽度工具类 === */
.page-container {
  padding: 28px 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-form {
  padding: 28px 32px;
  max-width: 960px;
  margin: 0 auto;
}

.page-card {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  padding: 24px;
  box-shadow: var(--shadow-card);
}

/* 工具栏 */
.page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

/* 分页 */
.page-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* === 响应式：平板 (768px - 1023px) === */
@media (max-width: 1023px) {
  .page-container,
  .page-form {
    padding: 20px 16px;
  }
}

/* === 响应式：手机 (< 768px) === */
@media (max-width: 767px) {
  .page-container,
  .page-form {
    padding: 16px 12px;
  }

  .page-card {
    padding: 16px;
    border-radius: var(--radius-base);
  }

  /* 表格横向滚动 */
  .table-responsive {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* 工具栏纵向堆叠 */
  .page-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .page-toolbar .el-form {
    width: 100%;
  }

  .page-toolbar .el-form-item {
    display: block;
    margin-right: 0;
    margin-bottom: 8px;
  }

  .page-toolbar .el-input,
  .page-toolbar .el-select {
    width: 100% !important;
  }

  /* 分页居中 */
  .page-pagination {
    justify-content: center;
  }

  /* 对话框手机适配 */
  .el-dialog {
    width: 90vw !important;
  }

  /* 描述列表堆叠 */
  .el-descriptions__body .el-descriptions__table {
    display: block;
  }
}
```

- [ ] **步骤 2：Commit**

```bash
git add web/vue3/src/styles/global.css
git commit -m "feat: 全局CSS基础设施 — 页面工具类 + 响应式断点

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### 任务 2：页面宽度统一（所有列表/编辑/通知页）

**文件：**
- 修改：`web/vue3/src/pages/dashboard/index.vue`（仅 CSS 部分）
- 修改：`web/vue3/src/pages/host/list.vue`
- 修改：`web/vue3/src/pages/user/list.vue`
- 修改：`web/vue3/src/pages/taskLog/list.vue`
- 修改：`web/vue3/src/pages/loginLog/list.vue`
- 修改：`web/vue3/src/pages/task/edit.vue`
- 修改：`web/vue3/src/pages/host/edit.vue`
- 修改：`web/vue3/src/pages/user/edit.vue`
- 修改：`web/vue3/src/pages/system/notification/email.vue`
- 修改：`web/vue3/src/pages/system/notification/feishu.vue`
- 修改：`web/vue3/src/pages/system/notification/wecom.vue`
- 修改：`web/vue3/src/pages/system/notification/webhook.vue`

- [ ] **步骤 1：Dashboard 宽度改为 1200px**

在 [web/vue3/src/pages/dashboard/index.vue](web/vue3/src/pages/dashboard/index.vue) 的 `<style scoped>` 中，将 `.dashboard` 改为使用 `.page-container`：

将 template 中的 `<div class="dashboard">` 改为 `<div class="page-container">`，把 task-card 改为 `<div class="page-card task-card">`。

```css
/* 替换原来的 .dashboard { padding: 28px 32px; max-width: 1400px; margin: 0 auto; } */
/* 使用 page-container 替代，删除 .dashboard 规则 */
/* .task-card 保留 background/padding/shadow 改用 page-card 公共类 */
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }
.task-card { /* 额外样式 */ }
.toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.search-bar { display: flex; align-items: center; gap: 8px; flex: 1; }
.actions { display: flex; gap: 8px; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
:deep(.action-col .cell) { white-space: nowrap; }

/* 平板：统计卡片 2列 */
@media (max-width: 1023px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}

/* 手机：搜索栏纵向 */
@media (max-width: 767px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .toolbar { flex-direction: column; }
  .search-bar { flex-wrap: wrap; }
  .search-bar .el-input,
  .search-bar .el-select { width: 100% !important; flex: 1; min-width: 0; }
}
```

在 template 中修改根元素 class：
```html
<!-- 原来：<div class="dashboard"> -->
<!-- 改为：<div class="page-container"> -->
<!-- 原来：<div class="task-card"> -->
<!-- 改为：<div class="page-card task-card"> -->
```

- [ ] **步骤 2：Host 列表页使用公共类**

在 [web/vue3/src/pages/host/list.vue](web/vue3/src/pages/host/list.vue) 中：
- 将 `<div class="page">` 改为 `<div class="page-container">`
- 将 `<div class="page-card">` 保持不变（已在 global.css 定义）
- 删除 `<style scoped>` 中的 `.page` 和 `.page-card` 规则
- `.toolbar` 改为 `.page-toolbar`（或保留 local 定义覆盖）
- `.pagination` 改为 `.page-pagination`

实际上，因为 `.page` 和 `.page-card` 的样式已经在 global.css 中通过工具类定义了，我们只需要替换 class 名称。但每个文件可能还有自己独特的样式覆盖（如 host/list.vue 的 `.toolbar` 定义与 global.css 的 `.page-toolbar` 相同，合并即可）。

简化做法：template 中的 class 改为 `page-container` 和 `page-card`，删除 `<style scoped>` 中与 global.css 重复的规则。

```html
<template>
  <div class="page-container">
    <div class="page-card">
      <!-- 内容不变 -->
    </div>
  </div>
</template>
```

```css
<style scoped>
/* 删除 .page 和 .page-card 规则（已在 global.css 中作为工具类定义） */
/* 保留项目特有的覆盖 */
</style>
```

- [ ] **步骤 3：User 列表页使用公共类**

同样修改 [web/vue3/src/pages/user/list.vue](web/vue3/src/pages/user/list.vue)：
- template 中 `<div class="page">` → `<div class="page-container">`
- 删除 scoped 中重复的 `.page` `.page-card` `.toolbar` `.pagination` 规则

- [ ] **步骤 4：TaskLog 列表页使用公共类**

同样修改 [web/vue3/src/pages/taskLog/list.vue](web/vue3/src/pages/taskLog/list.vue)：
- template 中 `<div class="page">` → `<div class="page-container">`
- 删除 scoped 中重复的 `.page` `.page-card` `.toolbar` `.pagination` 规则

- [ ] **步骤 5：LoginLog 列表页使用公共类**

同样修改 [web/vue3/src/pages/loginLog/list.vue](web/vue3/src/pages/loginLog/list.vue)：
- template 中 `<div class="page">` → `<div class="page-container">`
- 删除 scoped 中重复的 `.page` `.page-card` `.pagination` 规则

- [ ] **步骤 6：Task 编辑页使用公共类**

修改 [web/vue3/src/pages/task/edit.vue](web/vue3/src/pages/task/edit.vue)：
- template 中 `<div class="edit-page">` → `<div class="page-form">`
- `<div class="edit-card">` → `<div class="page-card">`
- 删除 scoped 中的 `.edit-page` `.edit-card` 规则
- 保留 `.page-title` `.form-section` `.section-label` 等特有样式

- [ ] **步骤 7：Host 编辑页使用公共类**

修改 [web/vue3/src/pages/host/edit.vue](web/vue3/src/pages/host/edit.vue)：
- template 中 `<div class="page">` → `<div class="page-form">`
- 删除 scoped 中的 `.page` 规则

- [ ] **步骤 8：User 编辑页使用公共类**

修改 [web/vue3/src/pages/user/edit.vue](web/vue3/src/pages/user/edit.vue)：
- template 中 `<div class="page">` → `<div class="page-form">`
- 删除 scoped 中的 `.page` 规则

- [ ] **步骤 9：通知配置页宽度统一**

修改 4 个通知页面（email.vue / feishu.vue / wecom.vue / webhook.vue）：
- 将 `.notif-page` 的 `max-width: 900px` 改为 `max-width: 1200px`
- 或者统一替换为 `.page-container` + `.page-card`

```css
/* email.vue 的 style scoped 中 */
.notif-page { padding: 28px 32px; max-width: 1200px; margin: 0 auto; }
```

对 feishu.vue、wecom.vue、webhook.vue 做同样修改。

- [ ] **步骤 10：Commit**

```bash
git add web/vue3/src/pages/
git commit -m "feat: 统一页面宽度 — 列表页1200px，编辑页960px，通知页1200px

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### 任务 3：TaskDetail 卡片式展开组件

**文件：**
- 创建：`web/vue3/src/components/TaskDetail.vue`
- 修改：`web/vue3/src/pages/dashboard/index.vue`（el-table expand 部分）

- [ ] **步骤 1：创建 TaskDetail.vue**

新建 `web/vue3/src/components/TaskDetail.vue`：

```html
<template>
  <div class="task-detail">
    <div class="detail-grid">
      <div class="detail-card">
        <span class="detail-icon">📅</span>
        <span class="detail-label">创建时间</span>
        <span class="detail-value">{{ fmt(row.created) }}</span>
      </div>
      <div class="detail-card">
        <span class="detail-icon">🏷</span>
        <span class="detail-label">任务类型</span>
        <span class="detail-value">{{ row.level === 1 ? '主任务' : '子任务' }}</span>
      </div>
      <div class="detail-card">
        <span class="detail-icon">⏱</span>
        <span class="detail-label">超时设置</span>
        <span class="detail-value">{{ row.timeout > 0 ? row.timeout + '秒' : '不限制' }}</span>
      </div>
      <div class="detail-card">
        <span class="detail-icon">🔁</span>
        <span class="detail-label">重试次数</span>
        <span class="detail-value">{{ row.retry_times }}次</span>
      </div>
      <div class="detail-card">
        <span class="detail-icon">🕐</span>
        <span class="detail-label">Cron 表达式</span>
        <span class="detail-value cron">{{ row.spec }}</span>
      </div>
      <div class="detail-card command-card">
        <span class="detail-icon">▶</span>
        <span class="detail-label">执行命令</span>
        <span class="detail-value cmd">{{ row.command || '-' }}</span>
      </div>
      <div v-if="row.remark" class="detail-card remark-card">
        <span class="detail-icon">📝</span>
        <span class="detail-label">备注</span>
        <span class="detail-value">{{ row.remark }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  row: { type: Object, required: true }
})

function fmt(t) {
  if (!t) return '-'
  const d = new Date(t)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
</script>

<style scoped>
.task-detail {
  padding: 16px 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.detail-card {
  background: var(--color-background);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid var(--color-border);
}

.detail-icon {
  font-size: 14px;
}

.detail-label {
  font-size: 11px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.detail-value.cron {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 13px;
  color: var(--color-primary);
}

.detail-value.cmd {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 12px;
  color: var(--color-text-secondary);
  word-break: break-all;
  line-height: 1.4;
}

.command-card {
  grid-column: span 2;
}

.remark-card {
  grid-column: span 2;
}

@media (max-width: 767px) {
  .detail-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .command-card,
  .remark-card {
    grid-column: span 2;
  }

  .detail-card {
    padding: 10px;
  }

  .detail-value {
    font-size: 13px;
  }
}
</style>
```

- [ ] **步骤 2：Dashboard 中使用 TaskDetail**

修改 [web/vue3/src/pages/dashboard/index.vue](web/vue3/src/pages/dashboard/index.vue)：
- import 添加 `import TaskDetail from '@/components/TaskDetail.vue'`
- 将 `el-table-column type="expand"` 的 template 替换为：

```html
<el-table-column type="expand">
  <template #default="{ row }">
    <TaskDetail :row="row" />
  </template>
</el-table-column>
```

删除原来的：
```html
<el-descriptions :column="2" size="small" border>
  <el-descriptions-item label="创建时间">{{ fmt(row.created) }}</el-descriptions-item>
  <el-descriptions-item label="类型">{{ row.level===1?'主任务':'子任务' }}</el-descriptions-item>
  <el-descriptions-item label="超时">{{ row.timeout>0?row.timeout+'秒':'不限制' }}</el-descriptions-item>
  <el-descriptions-item label="重试">{{ row.retry_times }}次</el-descriptions-item>
  <el-descriptions-item v-if="row.remark" label="备注" :span="2">{{ row.remark }}</el-descriptions-item>
</el-descriptions>
```

- [ ] **步骤 3：Commit**

```bash
git add web/vue3/src/components/TaskDetail.vue web/vue3/src/pages/dashboard/index.vue
git commit -m "feat: 任务列表展开行改为卡片式信息网格

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### 任务 4：AppHeader 移动端汉堡菜单

**文件：**
- 修改：`web/vue3/src/components/AppHeader.vue`

- [ ] **步骤 1：改造 AppHeader 支持响应式**

修改 [web/vue3/src/components/AppHeader.vue](web/vue3/src/components/AppHeader.vue)：

```html
<template>
  <header class="app-header">
    <div class="header-inner">
      <div class="header-left">
        <router-link to="/dashboard" class="logo-link"><span class="logo">⚡ gocron</span></router-link>
        <!-- 桌面导航 -->
        <nav class="nav-links">
          <router-link to="/dashboard" class="nav-link" :class="{active: $route.path.startsWith('/dashboard') || ($route.path.startsWith('/task') && !$route.path.startsWith('/task/log'))}">任务管理</router-link>
          <router-link to="/task/log" class="nav-link" :class="{active: $route.path.startsWith('/task/log')}">任务日志</router-link>
          <router-link to="/host" class="nav-link" :class="{active: $route.path.startsWith('/host')}">任务节点</router-link>
          <router-link v-if="userStore.isAdmin" to="/user" class="nav-link" :class="{active: $route.path.startsWith('/user') && !$route.path.includes('/login')}">用户管理</router-link>
          <router-link v-if="userStore.isAdmin" to="/system/notification/email" class="nav-link" :class="{active: $route.path.startsWith('/system')}">系统管理</router-link>
        </nav>
      </div>
      <div class="header-right">
        <!-- 移动端汉堡按钮 -->
        <el-button class="hamburger-btn" text @click="drawerVisible = true">
          <el-icon :size="22"><Menu /></el-icon>
        </el-button>
        <!-- 用户下拉 -->
        <el-dropdown trigger="click" @command="handleCommand">
          <span class="user-info">
            <el-avatar :size="32" style="background:var(--color-primary)">{{ userStore.username?.charAt(0)?.toUpperCase() }}</el-avatar>
            <span class="username">{{ userStore.username }}</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="password"><el-icon><Lock /></el-icon> 修改密码</el-dropdown-item>
              <el-dropdown-item command="logout" divided><el-icon><SwitchButton /></el-icon> 退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 移动端侧滑菜单 -->
    <el-drawer
      v-model="drawerVisible"
      direction="ltr"
      size="260px"
      :with-header="false"
    >
      <div class="drawer-logo">
        <span>⚡ gocron</span>
      </div>
      <nav class="drawer-nav">
        <router-link to="/dashboard" class="drawer-link" :class="{active: $route.path.startsWith('/dashboard') || ($route.path.startsWith('/task') && !$route.path.startsWith('/task/log'))}" @click="drawerVisible = false">📋 任务管理</router-link>
        <router-link to="/task/log" class="drawer-link" :class="{active: $route.path.startsWith('/task/log')}" @click="drawerVisible = false">📄 任务日志</router-link>
        <router-link to="/host" class="drawer-link" :class="{active: $route.path.startsWith('/host')}" @click="drawerVisible = false">🖥 任务节点</router-link>
        <router-link v-if="userStore.isAdmin" to="/user" class="drawer-link" :class="{active: $route.path.startsWith('/user') && !$route.path.includes('/login')}" @click="drawerVisible = false">👥 用户管理</router-link>
        <router-link v-if="userStore.isAdmin" to="/system/notification/email" class="drawer-link" :class="{active: $route.path.startsWith('/system')}" @click="drawerVisible = false">⚙ 系统管理</router-link>
      </nav>
    </el-drawer>
  </header>
</template>
```

在 `<script setup>` 中添加：
```js
import { ref } from 'vue'
import { Menu } from '@element-plus/icons-vue'

const drawerVisible = ref(false)
```

在 `<style scoped>` 中，保留原有样式并添加响应式样式：

```css
/* ... 保留原有样式 ... */

/* 汉堡按钮默认隐藏 */
.hamburger-btn {
  display: none;
}

/* 侧滑菜单样式 */
.drawer-logo {
  padding: 20px 20px 16px;
  font-size: 18px;
  font-weight: 800;
  color: var(--color-primary);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 8px;
}

.drawer-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 12px;
}

.drawer-link {
  display: block;
  padding: 12px 12px;
  border-radius: 8px;
  color: var(--color-text-primary);
  text-decoration: none;
  font-size: 15px;
  transition: background 0.15s;
}

.drawer-link:hover {
  background: var(--color-background);
}

.drawer-link.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 600;
}

/* 平板端：缩小导航间距 */
@media (max-width: 1023px) {
  .header-inner {
    padding: 0 16px;
  }

  .header-left {
    gap: 20px;
  }

  .nav-link {
    padding: 0 10px;
    font-size: 13px;
  }
}

/* 手机端：导航隐藏，显示汉堡按钮 */
@media (max-width: 767px) {
  .nav-links {
    display: none;
  }

  .hamburger-btn {
    display: inline-flex;
  }

  .header-inner {
    padding: 0 16px;
  }

  .header-left {
    gap: 12px;
  }

  .username {
    display: none;
  }
}
```

- [ ] **步骤 2：Commit**

```bash
git add web/vue3/src/components/AppHeader.vue
git commit -m "feat: AppHeader 响应式 — 手机端汉堡菜单 + el-drawer 侧滑导航

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### 任务 5：响应式细节完善

**文件：**
- 修改：`web/vue3/src/pages/dashboard/index.vue`（表格操作列移动端折叠）
- 修改：`web/vue3/src/pages/host/list.vue`
- 修改：`web/vue3/src/pages/user/list.vue`
- 修改：`web/vue3/src/pages/task/edit.vue`（表单响应式 el-col）

- [ ] **步骤 1：Dashboard 表格操作列移动端折叠**

在 [web/vue3/src/pages/dashboard/index.vue](web/vue3/src/pages/dashboard/index.vue) 的 `<style scoped>` 中添加：

```css
/* 操作按钮默认可见，更多按钮默认隐藏 */
.show-mobile { display: none; }

@media (max-width: 767px) {
  .hide-mobile { display: none; }
  .show-mobile { display: inline-flex; }
}
```

在操作列的 template 中：
```html
<el-table-column label="操作" min-width="230" fixed="right" class-name="action-col">
  <template #default="{row}">
    <el-button text size="small" type="primary" class="hide-mobile" @click="runTask(row)">执行</el-button>
    <el-button text size="small" type="primary" class="hide-mobile" @click="$router.push('/task/edit/'+row.id)">编辑</el-button>
    <el-button text size="small" type="primary" class="hide-mobile" @click="$router.push('/task/log?task_id='+row.id)">日志</el-button>
    <el-popconfirm title="确定删除?" class="hide-mobile"><template #reference><el-button text size="small" type="danger">删除</el-button></template></el-popconfirm>
    <!-- 移动端：更多下拉 -->
    <el-dropdown class="show-mobile" trigger="click">
      <el-button text size="small">更多 <el-icon><ArrowDown /></el-icon></el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="runTask(row)">执行</el-dropdown-item>
          <el-dropdown-item @click="$router.push('/task/edit/'+row.id)">编辑</el-dropdown-item>
          <el-dropdown-item @click="$router.push('/task/log?task_id='+row.id)">日志</el-dropdown-item>
          <el-dropdown-item @click="removeTask(row)" divided>删除</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </template>
</el-table-column>
```

在 `<script setup>` import 中添加 `ArrowDown`：
```js
import { Search, Refresh, Plus, ArrowDown } from '@element-plus/icons-vue'
```

- [ ] **步骤 2：Host 列表页操作列移动端折叠**

修改 [web/vue3/src/pages/host/list.vue](web/vue3/src/pages/host/list.vue)：
- 操作列添加 `.hide-mobile` / `.show-mobile` class 和 `el-dropdown`（同上模式）
- 添加响应式 CSS

- [ ] **步骤 3：User 列表页操作列移动端折叠**

修改 [web/vue3/src/pages/user/list.vue](web/vue3/src/pages/user/list.vue)：
- 操作列添加 `.hide-mobile` / `.show-mobile` class 和 `el-dropdown`（同上模式）

- [ ] **步骤 4：Task 编辑页表单 el-col 响应式**

在 [web/vue3/src/pages/task/edit.vue](web/vue3/src/pages/task/edit.vue) 中，为所有 `el-col` 添加响应式 span：

```html
<!-- 示例：将 :span="12" 改为 :xs="24" :sm="12" -->
<el-row :gutter="24">
  <el-col :xs="24" :sm="12"><el-form-item label="任务名称" prop="name"><el-input v-model="form.name" /></el-form-item></el-col>
  <el-col :xs="24" :sm="12"><el-form-item label="标签"><el-input v-model="form.tag" placeholder="通过标签将任务分组" /></el-form-item></el-col>
</el-row>
<el-row :gutter="24">
  <el-col :xs="24" :sm="8"><el-form-item label="任务类型"><!-- ... --></el-form-item></el-col>
  <el-col v-if="form.level===1" :xs="24" :sm="8"><!-- ... --></el-col>
  <el-col v-if="form.level===1" :xs="24" :sm="8"><!-- ... --></el-col>
</el-row>
<!-- 执行配置 -->
<el-row :gutter="24">
  <el-col :xs="24" :sm="8"><el-form-item label="执行方式"><!-- ... --></el-form-item></el-col>
  <el-col v-if="form.protocol===1" :xs="24" :sm="8"><!-- ... --></el-form-item></el-col>
  <el-col v-if="form.protocol===2" :xs="24" :sm="16"><!-- ... --></el-form-item></el-col>
</el-row>
<!-- 高级配置 -->
<el-row :gutter="24">
  <el-col :xs="24" :sm="12"><el-form-item label="超时时间(秒)" prop="timeout"><!-- ... --></el-form-item></el-col>
  <el-col :xs="24" :sm="12"><el-form-item label="单实例运行"><!-- ... --></el-form-item></el-col>
</el-row>
<el-row :gutter="24">
  <el-col :xs="24" :sm="12"><el-form-item label="失败重试次数"><!-- ... --></el-form-item></el-col>
  <el-col :xs="24" :sm="12"><el-form-item label="重试间隔(秒)"><!-- ... --></el-form-item></el-col>
</el-row>
<!-- 通知配置 -->
<el-row :gutter="24">
  <el-col :xs="24" :sm="8"><el-form-item label="通知状态"><!-- ... --></el-form-item></el-col>
  <el-col v-if="form.notify_status>1" :xs="24" :sm="8"><el-form-item label="通知类型"><!-- ... --></el-form-item></el-col>
</el-row>
```

- [ ] **步骤 5：所有表格添加横向滚动容器**

在 dashboard、host/list、user/list、taskLog/list、loginLog/list 的 template 中，为 `el-table` 外层包裹响应式容器：

```html
<div class="table-responsive">
  <el-table :data="tasks" v-loading="loading" style="width:100%">
    <!-- ... -->
  </el-table>
</div>
```

- [ ] **步骤 6：Commit**

```bash
git add web/vue3/src/pages/
git commit -m "feat: 响应式细节 — 操作列折叠、表单响应式列、表格横向滚动

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### 任务 6：验证

- [ ] **步骤 1：构建验证**

```bash
cd web/vue3 && npm run build
```

预期：构建成功，无错误。

- [ ] **步骤 2：检查构建输出**

```bash
ls -la web/vue3/dist/
```

预期：有 index.html 和 assets/ 目录。

- [ ] **步骤 3：交互式验证**

```bash
cd web/vue3 && npm run dev
```

在浏览器中验证：
1. 桌面端（≥1024px）：所有页面宽度统一为 1200px（列表/通知）或 960px（编辑）；任务展开行显示卡片网格
2. 平板端（768-1023px）：统计卡片 2×2，导航间距缩小
3. 手机端（<768px）：汉堡菜单出现、表格可横向滚动、工具栏纵向堆叠、操作列显示"更多"下拉

- [ ] **步骤 4：Commit（如有微调）**

如果构建过程中有任何修正，提交修正。否则任务完成。
