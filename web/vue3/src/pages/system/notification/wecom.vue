<template>
  <div class="notif-page">
    <NotifTabs />
    <div class="notif-card">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <div class="section-title">💬 企业微信机器人配置</div>
        <el-form-item label="Webhook URL" prop="url"><el-input v-model="form.url" placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..." /></el-form-item>
        <el-form-item label="通知模板"><el-input v-model="form.template" type="textarea" :rows="5" /></el-form-item>
        <el-form-item><el-button type="primary" @click="submit">保存</el-button></el-form-item>
      </el-form>
      <div style="border-top:1px solid var(--color-border);padding-top:20px;margin-top:20px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <h3 style="font-size:15px">📌 通知群组</h3>
          <el-button size="small" type="primary" @click="showAdd = true">新增群组</el-button>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <el-tag v-for="g in groups" :key="g.id" closable @close="removeGroup(g)">{{ g.name }}</el-tag>
          <span v-if="!groups.length" style="color:#999;font-size:13px">暂无群组</span>
        </div>
      </div>
      <el-dialog v-model="showAdd" title="新增群组" width="400">
        <el-form><el-form-item label="群组名称"><el-input v-model="newName" /></el-form-item></el-form>
        <template #footer><el-button @click="showAdd=false">取消</el-button><el-button type="primary" @click="addGroup">确定</el-button></template>
      </el-dialog>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import notifService from '@/api/notification'
import NotifTabs from './tabs.vue'

const formRef = ref(null); const showAdd = ref(false); const newName = ref('')
const groups = ref([])
const form = reactive({ url: '', template: '' })
const rules = { url: [{ required: true, message: '请输入 Webhook URL', trigger: 'blur' }] }

onMounted(() => load())

function load() { notifService.wecom(data => { if (data) { Object.assign(form, data); groups.value = data.groups || [] } }) }
function submit() { formRef.value?.validate(v => { if (!v) return; notifService.updateWeCom({ ...form }, () => { ElMessage.success('保存成功'); load() }) }) }
function addGroup() { if (!newName.value) { ElMessage.warning('请输入名称'); return }; notifService.createWeComGroup(newName.value, () => { showAdd.value = false; newName.value = ''; load() }) }
function removeGroup(g) { notifService.removeWeComGroup(g.id, () => load()) }
</script>
<style scoped>
.notif-page { padding: 28px 32px; max-width: 900px; margin: 0 auto; }
.notif-card { background: var(--color-surface); border-radius: var(--radius-card); padding: 24px; box-shadow: var(--shadow-card); }
.section-title { font-size: 15px; font-weight: 600; margin-bottom: 16px; }
</style>
