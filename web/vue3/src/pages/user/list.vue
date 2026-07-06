<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar"><h2>用户管理</h2><el-button type="primary" @click="$router.push('/user/create')"><el-icon><Plus /></el-icon> 新增</el-button></div>
      <el-table :data="users" v-loading="loading" style="width:100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="用户名" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column label="角色" width="100"><template #default="{row}"><el-tag :type="row.is_admin===1?'danger':'info'" size="small">{{ row.is_admin===1?'管理员':'普通用户' }}</el-tag></template></el-table-column>
        <el-table-column label="状态" width="80"><template #default="{row}"><el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" /></template></el-table-column>
        <el-table-column label="操作" width="240">
          <template #default="{row}">
            <el-button size="small" type="primary" @click="$router.push('/user/edit/'+row.id)">编辑</el-button>
            <el-button size="small" @click="$router.push('/user/edit-password/'+row.id)">修改密码</el-button>
            <el-popconfirm title="确定删除?" @confirm="removeUser(row)"><template #reference><el-button size="small" type="danger">删除</el-button></template></el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="prev,pager,next,total" background @change="loadUsers" /></div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import userService from '@/api/user'

const users = ref([]); const total = ref(0); const loading = ref(false)
const page = ref(1); const pageSize = ref(20)

onMounted(() => loadUsers())

function loadUsers() {
  loading.value = true
  userService.list({ page: page.value, page_size: pageSize.value }, data => {
    users.value = data.data || []; total.value = data.total || 0; loading.value = false
  })
}
function toggleStatus(row) { row.status ? userService.enable(row.id) : userService.disable(row.id) }
function removeUser(row) { userService.remove(row.id, () => loadUsers()) }
</script>
<style scoped>
.page { padding: 28px 32px; max-width: 1200px; margin: 0 auto; }
.page-card { background: var(--color-surface); border-radius: var(--radius-card); padding: 24px; box-shadow: var(--shadow-card); }
.toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
