<template>
  <div class="page"><div class="page-card">
    <h2 style="margin-bottom:16px">登录日志</h2>
    <el-table :data="logs" v-loading="loading" style="width:100%">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="ip" label="登录IP" />
      <el-table-column label="登录时间"><template #default="{row}">{{ fmt(row.created) }}</template></el-table-column>
    </el-table>
    <div class="pagination"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="prev,pager,next,total" background @change="loadLogs" /></div>
  </div></div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import systemService from '@/api/system'
const logs = ref([]); const total = ref(0); const loading = ref(false)
const page = ref(1); const pageSize = ref(20)

onMounted(() => loadLogs())

function loadLogs() {
  loading.value = true
  systemService.loginLogList({ page: page.value, page_size: pageSize.value }, data => { logs.value = data.data || []; total.value = data.total || 0; loading.value = false })
}
function fmt(t) {
  if (!t) return ''
  const d = new Date(t); const pad = n => n>=10?n:'0'+n
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>
<style scoped>
.page { padding: 28px 32px; max-width: 1200px; margin: 0 auto; }
.page-card { background: var(--color-surface); border-radius: var(--radius-card); padding: 24px; box-shadow: var(--shadow-card); }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
