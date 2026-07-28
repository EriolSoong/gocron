<template>
  <div class="page-container"><div class="page-card">
    <h2 style="margin-bottom:16px">任务日志</h2>
    <div class="toolbar">
      <div class="search-bar">
        <el-input v-model="search.task_id" placeholder="任务ID" clearable style="width:120px" />
        <el-select v-model="search.status" placeholder="状态" clearable style="width:110px">
          <el-option label="全部" value="" />
          <el-option label="成功" value="2" />
          <el-option label="失败" value="0" />
          <el-option label="执行中" value="1" />
          <el-option label="取消" value="3" />
        </el-select>
        <el-button type="primary" @click="loadLogs">搜索</el-button>
      </div>
      <div class="actions">
        <el-switch v-model="autoRefresh" active-text="自动刷新" inactive-text="手动" @change="toggleAutoRefresh" style="margin-right:12px" />
        <el-button v-if="userStore.isAdmin" type="danger" @click="clearLog">清空日志</el-button>
        <el-button @click="loadLogs">刷新</el-button>
      </div>
    </div>
    <div class="table-responsive">
    <el-table :data="logs" v-loading="loading" class="task-table" style="width:100%">
      <el-table-column type="expand">
        <template #default="{row}">
          <div class="expand-info">
            <span class="expand-item"><b>cron:</b> {{ row.spec }}</span>
            <span class="expand-item"><b>重试:</b> {{ row.retry_times }}次</span>
            <span class="expand-item"><b>命令:</b> {{ row.command }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="执行时间" width="170">
        <template #default="{row}">
          <span class="time-cell">{{ fmt(row.start_time) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="task_id" label="任务ID" width="80" />
      <el-table-column prop="name" label="任务名称" min-width="140" show-overflow-tooltip />
      <el-table-column label="方式" width="90">
        <template #default="{row}">
          <span class="protocol-badge" :class="row.protocol===1?'http':'shell'">{{ row.protocol===1?'HTTP':'Shell' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{row}">
          <span class="status-dot" :class="statusClass(row.status)" />
          <span class="status-text">{{ statusText(row.status) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="耗时" width="80">
        <template #default="{row}">
          <span class="time-text">{{ row.total_time }}s</span>
        </template>
      </el-table-column>
      <el-table-column label="结果" min-width="100">
        <template #default="{row}">
          <el-button v-if="row.status===2||row.status===0" size="small" @click="showResult(row)">查看详情</el-button>
          <el-button v-if="row.status===1&&row.protocol===2&&userStore.isAdmin" size="small" type="danger" @click="stopTask(row)">停止</el-button>
        </template>
      </el-table-column>
    </el-table>
    </div>
    <div class="pagination"><Pagination v-model="page" v-model:page-size="pageSize" :total="total" @change="loadLogs" /></div>
    <el-dialog v-model="dialogVisible" title="执行结果" width="680px">
      <h4>命令</h4>
      <pre>{{ currentResult.command }}</pre>
      <h4>输出</h4>
      <pre>{{ currentResult.result }}</pre>
    </el-dialog>
  </div></div>
</template>
<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import Pagination from "@/components/Pagination.vue"
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import taskLogService from '@/api/taskLog'

const userStore = useUserStore()
const route = useRoute()
const logs = ref([]); const total = ref(0); const loading = ref(false)
const page = ref(1); const pageSize = ref(20)
const search = reactive({ task_id: '', status: '' })
const dialogVisible = ref(false); const currentResult = reactive({ command: '', result: '' })
	const autoRefresh = ref(false)
	let refreshTimer = null

	onMounted(() => loadLogs())
	onUnmounted(() => { if (refreshTimer) clearInterval(refreshTimer) })

function loadLogs() {
  loading.value = true
  taskLogService.list({ page: page.value, page_size: pageSize.value, task_id: search.task_id, status: search.status }, data => {
    logs.value = data.data || []; total.value = data.total || 0; loading.value = false
  })
}
function toggleAutoRefresh(val) {
  if (val) {
    refreshTimer = setInterval(() => loadLogs(), 10000)
  } else {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}
function clearLog() {
  ElMessageBox.confirm('确定清空所有日志?', '提示').then(() => taskLogService.clear(() => { page.value = 1; loadLogs() })).catch(() => {})
}
function stopTask(row) { taskLogService.stop(row.id, row.task_id, () => loadLogs()) }
function showResult(row) { currentResult.command = row.command; currentResult.result = row.result; dialogVisible.value = true }

function fmt(t) {
  if (!t) return '-'
  const d = new Date(t)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function statusClass(s) {
  return { 0: 'failed', 1: 'running', 2: 'success', 3: 'cancelled' }[s] || ''
}
function statusText(s) {
  return { 0: '失败', 1: '执行中', 2: '成功', 3: '已取消' }[s] || '-'
}
</script>
<style scoped>
.toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.search-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.actions { display: flex; gap: 8px; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
pre { background: #1e1e2e; color: #cdd6f4; padding: 12px; border-radius: 6px; font-size: 12px; white-space: pre-wrap; word-wrap: break-word; max-height: 300px; overflow: auto; margin-bottom: 12px; }

/* 展开行 */
.expand-info { display: flex; gap: 24px; flex-wrap: wrap; padding: 4px 0; font-size: 13px; }
.expand-item { color: var(--color-text-secondary); }
.expand-item b { color: var(--color-text-muted); font-weight: 500; margin-right: 4px; }

/* 执行时间 */
.time-cell { font-family: 'SF Mono', Monaco, monospace; font-size: 13px; color: var(--color-text-secondary); }

/* 耗时 */
.time-text { font-size: 13px; color: var(--color-text-secondary); font-family: monospace; }

/* 协议徽章 */
.protocol-badge { display: inline-block; padding: 2px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
.protocol-badge.http { background: #e0f2fe; color: #0369a1; }
.protocol-badge.shell { background: #fdf4ff; color: #7e22ce; }

/* 状态 */
.status-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
.status-dot.success { background: var(--color-success); box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15); }
.status-dot.failed { background: var(--color-danger); box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12); }
.status-dot.running { background: var(--color-warning); box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.15); }
.status-dot.cancelled { background: var(--color-text-muted); box-shadow: 0 0 0 3px rgba(153, 153, 153, 0.12); }
.status-text { font-size: 13px; color: var(--color-text-secondary); vertical-align: middle; }

@media (max-width: 767px) {
  .search-bar { flex-direction: column; }
  .search-bar .el-input,
  .search-bar .el-select { width: 100% !important; }
}
</style>
