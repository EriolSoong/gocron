<template>
  <div class="notif-page">
    <NotifTabs />
    <div class="notif-card">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" label-position="top">
        <div class="section-title">📧 邮件服务器配置</div>
        <el-row :gutter="24">
          <el-col :span="12"><el-form-item label="SMTP 服务器" prop="host"><el-input v-model="form.host" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="端口" prop="port"><el-input v-model.number="form.port" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12"><el-form-item label="用户名" prop="user"><el-input v-model="form.user" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="密码" prop="password"><el-input v-model="form.password" type="password" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="通知模板"><el-input v-model="form.template" type="textarea" :rows="5" /></el-form-item>
        <el-form-item><el-button type="primary" @click="submit">保存</el-button></el-form-item>
      </el-form>
      <div style="border-top:1px solid var(--color-border);padding-top:20px;margin-top:20px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <h3 style="font-size:15px">通知用户</h3>
          <el-button size="small" type="primary" @click="showAddUser = true">新增用户</el-button>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <el-tag v-for="u in receivers" :key="u.email" closable @close="removeUser(u)">{{ u.username }} - {{ u.email }}</el-tag>
          <span v-if="!receivers.length" style="color:#999;font-size:13px">暂无通知用户</span>
        </div>
      </div>
      <el-dialog v-model="showAddUser" title="新增用户" width="400">
        <el-form><el-form-item label="用户名"><el-input v-model="newUser.username" /></el-form-item><el-form-item label="邮箱"><el-input v-model="newUser.email" /></el-form-item></el-form>
        <template #footer><el-button @click="showAddUser=false">取消</el-button><el-button type="primary" @click="addUser">确定</el-button></template>
      </el-dialog>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import notifService from '@/api/notification'
import NotifTabs from './tabs.vue'

const formRef = ref(null)
const showAddUser = ref(false)
const receivers = ref([])
const newUser = reactive({ username: '', email: '' })
const form = reactive({ host: '', port: 465, user: '', password: '', template: '' })
const rules = { host: [{ required: true, message: '请输入服务器地址', trigger: 'blur' }], port: [{ type: 'number', required: true, message: '请输入端口', trigger: 'blur' }], user: [{ required: true, message: '请输入用户名', trigger: 'blur' }], password: [{ required: true, message: '请输入密码', trigger: 'blur' }] }

onMounted(() => load())

function load() {
  notifService.mail(data => {
    if (data) { Object.assign(form, data); receivers.value = data.mail_users || [] }
  })
}
function submit() {
  formRef.value?.validate(v => {
    if (!v) return
    notifService.updateMail({ host: form.host, port: form.port, user: form.user, password: form.password, template: form.template }, () => { ElMessage.success('保存成功'); load() })
  })
}
function addUser() {
  if (!newUser.username || !newUser.email) { ElMessage.warning('请填写完整'); return }
  notifService.createMailUser(newUser.username, newUser.email, () => { showAddUser.value = false; newUser.username = ''; newUser.email = ''; load() })
}
function removeUser(u) { notifService.removeMailUser(u.id, () => load()) }
</script>
<style scoped>
.notif-page { padding: 28px 32px; max-width: 900px; margin: 0 auto; }
.notif-card { background: var(--color-surface); border-radius: var(--radius-card); padding: 24px; box-shadow: var(--shadow-card); }
.section-title { font-size: 15px; font-weight: 600; margin-bottom: 16px; }
</style>
