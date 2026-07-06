<template>
  <div class="page">
    <div class="page-card">
      <h2 style="margin-bottom:16px">任务节点</h2>
      <div class="toolbar">
        <el-form :inline="true">
          <el-form-item label="主机名"><el-input v-model="search.name" style="width:160px" /></el-form-item>
          <el-form-item><el-button type="primary" @click="loadHosts">搜索</el-button></el-form-item>
        </el-form>
        <div><el-button v-if="userStore.isAdmin" type="primary" @click="$router.push('/host/create')"><el-icon><Plus /></el-icon> 新增</el-button><el-button @click="loadHosts">刷新</el-button></div>
      </div>
      <el-table :data="hosts" v-loading="loading" style="width:100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="alias" label="节点名称" width="150" />
        <el-table-column prop="name" label="主机名" width="180" />
        <el-table-column prop="port" label="端口" width="80" />
        <el-table-column prop="remark" label="备注" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{row}">
            <el-button size="small" type="primary" @click="$router.push('/host/edit/'+row.id)">编辑</el-button>
            <el-button size="small" @click="testConn(row)">测试连接</el-button>
            <el-button size="small" @click="$router.push('/task?host_id='+row.id)">查看任务</el-button>
            <el-popconfirm title="确定删除?" @confirm="removeHost(row)"><template #reference><el-button size="small" type="danger">删除</el-button></template></el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="sizes,prev,pager,next,total" background @change="loadHosts" /></div>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import hostService from '@/api/host'

const userStore = useUserStore()
const hosts = ref([]); const total = ref(0); const loading = ref(false)
const page = ref(1); const pageSize = ref(20)
const search = reactive({ name: '' })

onMounted(() => loadHosts())

function loadHosts() {
  loading.value = true
  hostService.list({ page: page.value, page_size: pageSize.value, ...search }, data => {
    hosts.value = data.data || []; total.value = data.total || 0; loading.value = false
  })
}
function testConn(row) { hostService.ping(row.id, () => ElMessage.success('连接成功')) }
function removeHost(row) { hostService.remove(row.id, () => loadHosts()) }
</script>
<style scoped>
.page { padding: 28px 32px; max-width: 1200px; margin: 0 auto; }
.page-card { background: var(--color-surface); border-radius: var(--radius-card); padding: 24px; box-shadow: var(--shadow-card); }
.toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
