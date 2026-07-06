<template>
  <div class="page"><div class="page-card">
    <h2 style="margin-bottom:16px">任务日志</h2>
    <div class="toolbar">
      <el-form :inline="true">
        <el-form-item label="任务ID"><el-input v-model="search.task_id" style="width:120px" /></el-form-item>
        <el-form-item label="状态"><el-select v-model="search.status" style="width:110px" clearable><el-option label="全部" value="" /><el-option label="成功" value="2" /><el-option label="失败" value="0" /><el-option label="执行中" value="1" /><el-option label="取消" value="3" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" @click="loadLogs">搜索</el-button></el-form-item>
      </el-form>
      <div><el-button v-if="userStore.isAdmin" type="danger" @click="clearLog">清空日志</el-button><el-button @click="loadLogs">刷新</el-button></div>
    </div>
    <el-table :data="logs" v-loading="loading" style="width:100%">
      <el-table-column type="expand">
        <template #default="{row}"><div style="padding:12px">重试: {{row.retry_times}}次 | cron: {{row.spec}} | 命令: {{row.command}}</div></template>
      </el-table-column>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="task_id" label="任务ID" width="70" />
      <el-table-column prop="name" label="任务名称" width="150" />
      <el-table-column label="方式" width="70"><template #default="{row}">{{ row.protocol===1?'http':'shell' }}</template></el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{row}"><el-tag :type="row.status===2?'success':row.status===0?'danger':row.status===1?'warning':'info'" size="small">{{ {0:'失败',1:'执行中',2:'成功',3:'取消'}[row.status] }}</el-tag></template>
      </el-table-column>
      <el-table-column label="结果" width="100">
        <template #default="{row}">
          <el-button v-if="row.status===2||row.status===0" size="small" @click="showResult(row)">查看</el-button>
          <el-button v-if="row.status===1&&row.protocol===2&&userStore.isAdmin" size="small" type="danger" @click="stopTask(row)">停止</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="sizes,prev,pager,next,total" background @change="loadLogs" /></div>
    <el-dialog v-model="dialogVisible" title="执行结果"><h4>命令</h4><pre>{{ currentResult.command }}</pre><h4>输出</h4><pre>{{ currentResult.result }}</pre></el-dialog>
  </div></div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import taskLogService from '@/api/taskLog'

const userStore = useUserStore()
const logs = ref([]); const total = ref(0); const loading = ref(false)
const page = ref(1); const pageSize = ref(20)
const search = reactive({ task_id: '', status: '' })
const dialogVisible = ref(false); const currentResult = reactive({ command: '', result: '' })

onMounted(() => loadLogs())

function loadLogs() {
  loading.value = true
  taskLogService.list({ page: page.value, page_size: pageSize.value, ...search }, data => {
    logs.value = data.data || []; total.value = data.total || 0; loading.value = false
  })
}
function clearLog() {
  ElMessageBox.confirm('确定清空所有日志?', '提示').then(() => taskLogService.clear(() => { page.value = 1; loadLogs() })).catch(() => {})
}
function stopTask(row) { taskLogService.stop(row.id, row.task_id, () => loadLogs()) }
function showResult(row) { currentResult.command = row.command; currentResult.result = row.result; dialogVisible.value = true }
</script>
<style scoped>
.page { padding: 28px 32px; max-width: 1200px; margin: 0 auto; }
.page-card { background: var(--color-surface); border-radius: var(--radius-card); padding: 24px; box-shadow: var(--shadow-card); }
.toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
pre { background: #1e1e2e; color: #cdd6f4; padding: 12px; border-radius: 6px; font-size: 12px; white-space: pre-wrap; word-wrap: break-word; max-height: 300px; overflow: auto; margin-bottom: 12px; }
</style>
