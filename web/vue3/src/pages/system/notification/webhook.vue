<template>
  <div class="notif-page">
    <NotifTabs />
    <div class="notif-card">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <div class="section-title">🔗 Webhook 配置</div>
        <el-alert title="通知内容推送到指定URL, POST请求, 设置Header[ Content-Type: application/json]" type="info" :closable="false" show-icon style="margin-bottom:16px" />
        <el-form-item label="URL" prop="url"><el-input v-model="form.url" /></el-form-item>
        <el-form-item label="通知模板"><el-input v-model="form.template" type="textarea" :rows="6" /></el-form-item>
        <el-form-item><el-button type="primary" @click="submit">保存</el-button></el-form-item>
      </el-form>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import notifService from '@/api/notification'
import NotifTabs from './tabs.vue'

const formRef = ref(null)
const form = reactive({ url: '', template: '' })
const rules = { url: [{ required: true, message: '请输入 URL', trigger: 'blur' }] }

onMounted(() => notifService.webhook(data => { if (data) Object.assign(form, data) }))

function submit() { formRef.value?.validate(v => { if (!v) return; notifService.updateWebHook({ ...form }, () => ElMessage.success('保存成功')) }) }
</script>
<style scoped>
.notif-page { padding: 28px 32px; max-width: 900px; margin: 0 auto; }
.notif-card { background: var(--color-surface); border-radius: var(--radius-card); padding: 24px; box-shadow: var(--shadow-card); }
.section-title { font-size: 15px; font-weight: 600; margin-bottom: 16px; }
</style>
