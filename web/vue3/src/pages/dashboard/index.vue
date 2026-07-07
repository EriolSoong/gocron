<template>
  <div class="dashboard">
    <div class="stats-row">
      <StatCard icon="📋" label="总任务数" :value="stats.total_tasks" color="primary" />
      <StatCard icon="✅" label="运行中" :value="stats.active_tasks" color="success" />
      <StatCard icon="❌" label="失败(24h)" :value="stats.failed_last_24h" color="danger" />
      <StatCard icon="🖥" label="在线节点" :value="stats.online_hosts" color="info" />
    </div>
    <div class="task-card">
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
      <el-table :data="tasks" v-loading="loading" style="width:100%">
        <el-table-column type="expand">
          <template #default="{row}">
            <el-descriptions :column="2" size="small" border>
              <el-descriptions-item label="创建时间">{{ fmt(row.created) }}</el-descriptions-item>
              <el-descriptions-item label="类型">{{ row.level===1?'主任务':'子任务' }}</el-descriptions-item>
              <el-descriptions-item label="超时">{{ row.timeout>0?row.timeout+'秒':'不限制' }}</el-descriptions-item>
              <el-descriptions-item label="重试">{{ row.retry_times }}次</el-descriptions-item>
              <el-descriptions-item v-if="row.remark" label="备注" :span="2">{{ row.remark }}</el-descriptions-item>
            </el-descriptions>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column label="标签" width="100">
          <template #default="{row}"><el-tag v-if="row.tag" size="small" effect="plain" color="#e0e7ff" style="color:#4f46e5;border:none">{{ row.tag }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="spec" label="cron" width="110" />
        <el-table-column label="方式" width="80"><template #default="{row}">{{ row.protocol===2?'shell':'http' }}</template></el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{row}"><span :style="{color:row.status===1? 'var(--color-success)':'var(--color-danger)'}">● {{ row.status===1?'运行中':'已停止' }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="190" fixed="right">
          <template #default="{row}">
            <el-button text size="small" type="primary" @click="runTask(row)">执行</el-button>
            <el-button text size="small" type="primary" @click="$router.push('/task/edit/'+row.id)">编辑</el-button>
            <el-button text size="small" type="primary" @click="$router.push('/task/log?task_id='+row.id)">日志</el-button>
            <el-popconfirm title="确定删除?" @confirm="removeTask(row)"><template #reference><el-button text size="small" type="danger">删除</el-button></template></el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[20,50,100]" layout="sizes,prev,pager,next,total" background @change="loadTasks" />
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import StatCard from '@/components/StatCard.vue'
import taskService from '@/api/task'

const userStore = useUserStore()
const tasks = ref([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const search = reactive({ name: '', protocol: '', status: '' })
const stats = reactive({ total_tasks: 0, active_tasks: 0, failed_last_24h: 0, online_hosts: 0 })

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
function fmt(t) {
  if (!t) return ''
  const d = new Date(t)
  const pad = n => n>=10?n:'0'+n
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
</script>
<style scoped>
.dashboard { padding: 28px 32px; max-width: 1400px; margin: 0 auto; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }
.task-card { background: var(--color-surface); border-radius: var(--radius-card); padding: 20px; box-shadow: var(--shadow-card); }
.toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.search-bar { display: flex; align-items: center; gap: 8px; flex: 1; }
.actions { display: flex; gap: 8px; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
