<template>
  <div class="page"><div class="page-card" style="max-width:800px">
    <h2 style="margin-bottom:20px">⚡ 系统安装</h2>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="130px" label-position="top">
      <div class="section-title">🗄 数据库配置</div>
      <el-form-item label="数据库类型" prop="db_type"><el-select v-model="form.db_type" @change="updatePort" style="width:100%"><el-option label="MySQL" value="mysql" /><el-option label="PostgreSQL" value="postgres" /></el-select></el-form-item>
      <el-row :gutter="24">
        <el-col :span="12"><el-form-item label="主机名" prop="db_host"><el-input v-model="form.db_host" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="端口" prop="db_port"><el-input v-model.number="form.db_port" /></el-form-item></el-col>
      </el-row>
      <el-row :gutter="24">
        <el-col :span="12"><el-form-item label="用户名" prop="db_username"><el-input v-model="form.db_username" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="密码" prop="db_password"><el-input v-model="form.db_password" type="password" /></el-form-item></el-col>
      </el-row>
      <el-row :gutter="24">
        <el-col :span="12"><el-form-item label="数据库名称" prop="db_name"><el-input v-model="form.db_name" placeholder="需提前创建" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="表前缀"><el-input v-model="form.db_table_prefix" /></el-form-item></el-col>
      </el-row>
      <div class="section-title" style="margin-top:24px">👤 管理员账号</div>
      <el-row :gutter="24">
        <el-col :span="12"><el-form-item label="账号" prop="admin_username"><el-input v-model="form.admin_username" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="邮箱" prop="admin_email"><el-input v-model="form.admin_email" /></el-form-item></el-col>
      </el-row>
      <el-row :gutter="24">
        <el-col :span="12"><el-form-item label="密码" prop="admin_password"><el-input v-model="form.admin_password" type="password" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="确认密码" prop="confirm_password"><el-input v-model="form.confirm_admin_password" type="password" /></el-form-item></el-col>
      </el-row>
      <el-form-item><el-button type="primary" @click="submit" :loading="submitting" size="large">安装</el-button></el-form-item>
    </el-form>
  </div></div>
</template>
<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import installService from '@/api/install'

const router = useRouter()
const formRef = ref(null); const submitting = ref(false)
const form = reactive({ db_type: 'mysql', db_host: '127.0.0.1', db_port: 3306, db_username: '', db_password: '', db_name: '', db_table_prefix: '', admin_username: '', admin_password: '', confirm_admin_password: '', admin_email: '' })
const rules = { db_type: [{ required: true, message: '请选择数据库', trigger: 'blur' }], db_host: [{ required: true, message: '请输入主机名', trigger: 'blur' }], db_port: [{ type: 'number', required: true, message: '请输入端口', trigger: 'blur' }], db_username: [{ required: true, message: '请输入用户名', trigger: 'blur' }], db_password: [{ required: true, message: '请输入密码', trigger: 'blur' }], db_name: [{ required: true, message: '请输入数据库名', trigger: 'blur' }], admin_username: [{ required: true, message: '请输入账号', trigger: 'blur' }], admin_email: [{ type: 'email', required: true, message: '请输入邮箱', trigger: 'blur' }], admin_password: [{ required: true, min: 6, message: '至少6位', trigger: 'blur' }], confirm_admin_password: [{ required: true, min: 6, message: '至少6位', trigger: 'blur' }] }

function updatePort(t) { form.db_port = t === 'mysql' ? 3306 : 5432 }

function submit() {
  formRef.value?.validate(v => {
    if (!v) return
    if (form.admin_password !== form.confirm_admin_password) { ElMessage.warning('两次密码不一致'); return }
    submitting.value = true
    installService.store({ ...form }, () => { ElMessage.success('安装成功'); router.push('/dashboard') })
  })
}
</script>
<style scoped>
.page { padding: 28px 32px; max-width: 900px; margin: 0 auto; }
.page-card { background: var(--color-surface); border-radius: var(--radius-card); padding: 28px 32px; box-shadow: var(--shadow-card); }
.section-title { font-size: 14px; font-weight: 600; color: var(--color-primary); margin-bottom: 16px; border-bottom: 1px solid var(--color-border); padding-bottom: 8px; }
</style>
