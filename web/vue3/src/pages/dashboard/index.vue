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
      <el-table :data="tasks" v-loading="loading" style="width:100%">
        <el-table-column type="expand">
          <template #default="{row}">
            <TaskDetail :row="row" />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column label="标签" width="100">
          <template #default="{row}"><el-tag v-if="row.tag" size="small" effect="plain" color="#e0e7ff" style="color:#4f46e5;border:none">{{ row.tag }}</el-tag></template>
        </el-table-column>
        <el-table-column label="下次执行" width="160">
          <template #default="{row}">
            <span v-if="row.status===1" style="font-size:13px;color:var(--color-text-primary)">{{ nextRun(row.spec) }}</span>
            <span v-else style="font-size:13px;color:var(--color-text-muted)">已停止</span>
          </template>
        </el-table-column>
        <el-table-column label="方式" width="80"><template #default="{row}">{{ row.protocol===2?'shell':'http' }}</template></el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{row}"><el-tag size="small" :type="row.status===1?'success':'danger'" effect="dark">{{ row.status===1?'运行中':'已停止' }}</el-tag></template>
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
.toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.search-bar { display: flex; align-items: center; gap: 8px; flex: 1; }
.actions { display: flex; gap: 8px; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
:deep(.action-col .cell) { white-space: nowrap; }

@media (max-width: 1023px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 767px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .toolbar { flex-direction: column; }
  .search-bar { flex-wrap: wrap; }
  .search-bar .el-input,
  .search-bar .el-select { width: 100% !important; flex: 1; min-width: 0; }
}
</style>
