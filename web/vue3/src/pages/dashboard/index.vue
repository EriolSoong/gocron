<template>
  <div class="page-container">
    <div class="stats-row">
      <StatCard icon="📋" label="总任务数" :value="stats.total_tasks" color="primary" />
      <StatCard icon="✅" label="运行中" :value="stats.active_tasks" color="success" />
      <StatCard icon="❌" label="失败(24h)" :value="stats.failed_last_24h" color="danger" />
      <StatCard icon="🖥" label="在线节点" :value="stats.online_hosts" color="info" />
    </div>
    <div class="page-card task-card">
      <div class="toolbar">
        <div class="search-bar">
          <el-input v-model="search.name" placeholder="搜索任务名称、标签..." clearable :prefix-icon="Search" @keyup.enter="search" style="width:260px" />
          <el-select v-model="search.protocol" placeholder="执行方式" clearable style="width:130px"><el-option label="全部" value="" /><el-option label="HTTP" value="1" /><el-option label="Shell" value="2" /></el-select>
          <el-select v-model="search.status" placeholder="状态" clearable style="width:120px"><el-option label="全部" value="" /><el-option label="激活" value="1" /><el-option label="停止" value="0" /></el-select>
          <el-button type="primary" :icon="Search" @click="loadTasks">搜索</el-button>
        </div>
        <div class="actions">
          <el-button v-if="userStore.isAdmin" type="primary" @click="$router.push('/task/create')"><el-icon><Plus /></el-icon> 新增任务</el-button>
          <el-button @click="loadTasks" :icon="Refresh">刷新</el-button>
        </div>
      </div>
      <div class="table-responsive">
      <el-table :data="tasks" v-loading="loading" class="task-table">
        <el-table-column type="expand">
          <template #default="{row}">
            <TaskDetail :row="row" />
          </template>
        </el-table-column>
        <el-table-column label="名称" min-width="160">
          <template #default="{row}">
            <div class="name-cell">
              <span class="name-icon">{{ row.protocol === 2 ? '💻' : '🌐' }}</span>
              <div class="name-text">
                <span class="name-title">{{ row.name }}</span>
                <span v-if="row.tag" class="name-tag">{{ row.tag }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="下次执行" width="165">
          <template #default="{row}">
            <span v-if="row.status===1" class="next-run">{{ nextRun(row.spec) }}</span>
            <span v-else class="next-run stopped">已停止</span>
          </template>
        </el-table-column>
        <el-table-column label="方式" width="75" align="center">
          <template #default="{row}">
            <span class="protocol-badge" :class="row.protocol===2?'shell':'http'">{{ row.protocol===2?'Shell':'HTTP' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{row}">
            <span class="status-dot" :class="row.status===1?'active':'stopped'" />
            <span class="status-text">{{ row.status===1?'运行中':'已停止' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="230" fixed="right" class-name="action-col">
          <template #default="{row}">
            <span class="hide-mobile">
              <el-button text size="small" type="primary" @click="runTask(row)">执行</el-button>
              <el-button text size="small" type="primary" @click="$router.push('/task/edit/'+row.id)">编辑</el-button>
              <el-button text size="small" type="primary" @click="$router.push('/task/log?task_id='+row.id)">日志</el-button>
              <el-popconfirm title="确定删除?" @confirm="removeTask(row)"><template #reference><el-button text size="small" type="danger">删除</el-button></template></el-popconfirm>
            </span>
            <el-dropdown class="show-mobile" trigger="click">
              <el-button text size="small">更多 <el-icon><ArrowDown /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="runTask(row)">执行</el-dropdown-item>
                  <el-dropdown-item @click="$router.push('/task/edit/'+row.id)">编辑</el-dropdown-item>
                  <el-dropdown-item @click="$router.push('/task/log?task_id='+row.id)">日志</el-dropdown-item>
                  <el-dropdown-item divided @click="removeTask(row)">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      </div>
      <div class="pagination">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[20,50,100]" layout="sizes,prev,pager,next,total" background @change="loadTasks" />
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, Plus, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import StatCard from '@/components/StatCard.vue'
import TaskDetail from '@/components/TaskDetail.vue'
import taskService from '@/api/task'
import parser from 'cron-parser'

const userStore = useUserStore()
const tasks = ref([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const search = reactive({ name: '', protocol: '', status: '' })
const stats = reactive({ total_tasks: 0, active_tasks: 0, failed_last_24h: 0, online_hosts: 0 })

function nextRun(spec) {
  if (!spec) return '-'
  try {
    const interval = parser.parseExpression(spec)
    const d = interval.next().toDate()
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return spec
  }
}

onMounted(() => { loadStats(); loadTasks() })

function loadStats() {
  taskService.stats(data => { if (data) Object.assign(stats, data) })
}
function loadTasks() {
  loading.value = true
  const params = { page: page.value, page_size: pageSize.value, ...search }
  taskService.list(params, data => { tasks.value = data.data || []; total.value = data.total || 0; loading.value = false })
}
function runTask(row) { taskService.run(row.id, () => ElMessage.success('任务已开始执行')) }
function removeTask(row) { taskService.remove(row.id, () => loadTasks()) }
</script>
<style scoped>
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }
.task-card { /* page-card provides background/padding/shadow */ }
.toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.search-bar { display: flex; align-items: center; gap: 8px; flex: 1; }
.actions { display: flex; gap: 8px; }
.pagination { display: flex; justify-content: flex-end; margin-top: 20px; }

/* ===== 表格美化 ===== */
:deep(.task-table) {
  border: none;
  font-size: 14px;
}

/* 表头 */
:deep(.task-table .el-table__header-wrapper) {
  --el-table-header-bg-color: transparent;
}
:deep(.task-table th.el-table__cell) {
  background: transparent;
  border-bottom: 2px solid var(--color-border);
  padding: 14px 0 10px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 单元格 */
:deep(.task-table td.el-table__cell) {
  border-bottom: 1px solid #f5f5f5;
  padding: 16px 0;
}

/* 展开行 */
:deep(.task-table .el-table__expanded-cell) {
  padding: 0 16px 16px 50px !important;
  background: #fafbfc;
}

/* 行 hover */
:deep(.task-table .el-table__body tr:hover > td.el-table__cell) {
  background: #fafbfc;
}

/* 去掉表格底部的伪元素分隔线 */
:deep(.task-table .el-table__inner-wrapper::before) {
  display: none;
}

/* ===== 名称列 ===== */
.name-cell {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.name-icon {
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}
.name-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.name-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.3;
}
.name-tag {
  font-size: 11px;
  color: var(--color-text-muted);
  background: var(--color-background);
  padding: 1px 8px;
  border-radius: 4px;
  width: fit-content;
}

/* ===== 下次执行 ===== */
.next-run {
  font-size: 13px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  color: var(--color-text-primary);
  white-space: nowrap;
}
.next-run.stopped {
  color: var(--color-text-muted);
  font-family: inherit;
}

/* ===== 协议徽章 ===== */
.protocol-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}
.protocol-badge.http {
  background: #e0f2fe;
  color: #0369a1;
}
.protocol-badge.shell {
  background: #fdf4ff;
  color: #7e22ce;
}

/* ===== 状态 ===== */
.status-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: middle;
  position: relative;
  top: -1px;
}
.status-dot.active {
  background: var(--color-success);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}
.status-dot.stopped {
  background: var(--color-danger);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
}
.status-text {
  font-size: 13px;
  color: var(--color-text-secondary);
  vertical-align: middle;
}

/* ===== 操作列 ===== */
:deep(.action-col .cell) { white-space: nowrap; }

/* ===== 响应式 ===== */
@media (max-width: 1023px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 767px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .toolbar { flex-direction: column; }
  .search-bar { flex-wrap: wrap; }
  .search-bar .el-input,
  .search-bar .el-select { width: 100% !important; flex: 1; min-width: 0; }
  :deep(.task-table .el-table__expanded-cell) { padding-left: 20px !important; }
}
</style>
