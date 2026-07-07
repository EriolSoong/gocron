<template>
  <div class="edit-page">
    <div class="edit-card">
      <h2 class="page-title">{{ $route.params.id ? '编辑任务' : '创建任务' }}</h2>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <!-- 基本信息 -->
        <div class="form-section"><div class="section-label">基本信息</div>
          <el-row :gutter="24">
            <el-col :span="12"><el-form-item label="任务名称" prop="name"><el-input v-model="form.name" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="标签"><el-input v-model="form.tag" placeholder="通过标签将任务分组" /></el-form-item></el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="8"><el-form-item label="任务类型"><el-select v-model="form.level" :disabled="!!form.id" style="width:100%"><el-option :value="1" label="主任务" /><el-option :value="2" label="子任务" /></el-select></el-form-item></el-col>
            <el-col v-if="form.level===1" :span="8"><el-form-item label="依赖关系"><el-select v-model="form.dependency_status" style="width:100%"><el-option :value="1" label="强依赖" /><el-option :value="2" label="弱依赖" /></el-select></el-form-item></el-col>
            <el-col v-if="form.level===1" :span="8"><el-form-item label="子任务ID"><el-input v-model="form.dependency_task_id" placeholder="多个ID逗号分隔" /></el-form-item></el-col>
          </el-row>
        </div>
        <!-- 调度配置 -->
        <div class="form-section"><div class="section-label">调度配置</div>
          <el-form-item v-if="form.level===1" label="crontab 表达式" prop="spec">
            <el-input v-model="form.spec" placeholder="秒 分 时 天 月 周" />
            <div v-if="cronPreview" class="cron-box valid">
              <div class="cron-main"><span class="cron-icon">⏱️</span><div><div class="cron-label">下次执行时间</div><div class="cron-time">{{ cronPreview }}</div></div></div>
            </div>
            <div v-if="cronError" class="cron-box error">
              <span>{{ cronError }}</span>
            </div>
          </el-form-item>
        </div>
        <!-- 执行配置 -->
        <div class="form-section"><div class="section-label">执行配置</div>
          <el-row :gutter="24">
            <el-col :span="8"><el-form-item label="执行方式"><el-select v-model="form.protocol" style="width:100%"><el-option :value="1" label="HTTP" /><el-option :value="2" label="Shell" /></el-select></el-form-item></el-col>
            <el-col v-if="form.protocol===1" :span="8"><el-form-item label="请求方法"><el-select v-model="form.http_method" style="width:100%"><el-option :value="1" label="GET" /><el-option :value="2" label="POST" /></el-select></el-form-item></el-col>
            <el-col v-if="form.protocol===2" :span="16"><el-form-item label="任务节点"><el-select v-model="selectedHosts" multiple filterable style="width:100%"><el-option v-for="h in hosts" :key="h.id" :label="h.alias+' - '+h.name" :value="h.id" /></el-select></el-form-item></el-col>
          </el-row>
          <el-form-item label="命令/URL" prop="command">
            <el-input v-model="form.command" :rows="form.protocol===1?2:5" type="textarea" :placeholder="form.protocol===1?'请输入URL地址':'请输入shell命令'" />
          </el-form-item>
          <!-- HTTP POST 请求参数 -->
          <div v-if="form.protocol===1 && form.http_method===2" class="params-section">
            <div class="params-header"><span class="params-title">📦 请求参数</span>
              <el-radio-group v-model="paramMode" size="small"><el-radio-button value="json">JSON 文本</el-radio-button><el-radio-button value="form">表单模式</el-radio-button></el-radio-group>
            </div>
            <div v-if="paramMode==='json'">
              <div style="margin-bottom:8px"><el-button size="small" text @click="formatJson">📋 格式化</el-button></div>
              <el-input v-model="jsonText" type="textarea" :rows="8" style="font-family:monospace" />
            </div>
            <div v-else>
              <div style="font-size:12px;color:#999;margin-bottom:8px">Headers</div>
              <el-row v-for="(h,i) in headers" :key="'h'+i" :gutter="8" style="margin-bottom:6px">
                <el-col :span="10"><el-input v-model="h.key" placeholder="Header名" size="small" /></el-col>
                <el-col :span="10"><el-input v-model="h.value" placeholder="Header值" size="small" /></el-col>
                <el-col :span="4"><el-button text type="danger" size="small" @click="headers.splice(i,1)">✕</el-button></el-col>
              </el-row>
              <el-button text type="primary" size="small" @click="headers.push({key:'',value:''})">+ Header</el-button>
              <div style="font-size:12px;color:#999;margin:12px 0 8px">Body <el-radio-group v-model="bodyType" size="small" style="margin-left:8px"><el-radio-button value="json">JSON</el-radio-button><el-radio-button value="form-data">Form-Data</el-radio-button><el-radio-button value="urlencoded">x-www-form-urlencoded</el-radio-button></el-radio-group></div>
              <el-row v-for="(p,i) in formParams" :key="'p'+i" :gutter="8" style="margin-bottom:6px">
                <el-col :span="10"><el-input v-model="p.key" placeholder="参数名" size="small" /></el-col>
                <el-col :span="10"><el-input v-model="p.value" placeholder="参数值" size="small" /></el-col>
                <el-col :span="4"><el-button text type="danger" size="small" @click="formParams.splice(i,1)">✕</el-button></el-col>
              </el-row>
              <el-button text type="primary" size="small" @click="formParams.push({key:'',value:''})">+ 参数</el-button>
            </div>
          </div>
        </div>
        <!-- 高级配置 -->
        <div class="form-section"><div class="section-label">高级配置</div>
          <el-alert title="任务执行超时强制结束, 取值0-86400(秒), 默认0不限制" type="info" :closable="false" show-icon style="margin-bottom:12px" />
          <el-row :gutter="24">
            <el-col :span="12"><el-form-item label="超时时间(秒)" prop="timeout"><el-input v-model.number="form.timeout" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="单实例运行"><el-select v-model="form.multi" style="width:100%"><el-option label="是" :value="2" /><el-option label="否" :value="1" /></el-select></el-form-item></el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12"><el-form-item label="失败重试次数"><el-input v-model.number="form.retry_times" placeholder="0-10" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="重试间隔(秒)"><el-input v-model.number="form.retry_interval" placeholder="0-3600" /></el-form-item></el-col>
          </el-row>
        </div>
        <!-- 通知配置 -->
        <div class="form-section"><div class="section-label">通知配置</div>
          <el-row :gutter="24">
            <el-col :span="8"><el-form-item label="通知状态"><el-select v-model="form.notify_status" style="width:100%"><el-option :value="1" label="不通知" /><el-option :value="2" label="失败通知" /><el-option :value="3" label="总是通知" /><el-option :value="4" label="关键字匹配" /></el-select></el-form-item></el-col>
            <el-col v-if="form.notify_status>1" :span="8"><el-form-item label="通知类型"><el-select v-model="form.notify_type" style="width:100%"><el-option :value="2" label="邮件" /><el-option :value="3" label="飞书" /><el-option :value="4" label="企业微信" /><el-option :value="5" label="WebHook" /></el-select></el-form-item></el-col>
          </el-row>
          <el-form-item v-if="form.notify_status===4" label="关键字"><el-input v-model="form.notify_keyword" /></el-form-item>
          <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
        </div>
        <div class="form-actions">
          <el-button type="primary" @click="submit" :loading="submitting" size="large">保存</el-button>
          <el-button @click="$router.push('/dashboard')">取消</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import taskService from '@/api/task'
import parser from 'cron-parser'

const router = useRouter(); const route = useRoute()
const formRef = ref(null); const submitting = ref(false)
const hosts = ref([]); const selectedHosts = ref([])
const paramMode = ref('json'); const jsonText = ref('')
const headers = ref([{ key: 'Content-Type', value: 'application/json' }])
const formParams = ref([{ key: '', value: '' }])
const bodyType = ref('json')
const cronPreview = ref(''); const cronError = ref('')

const form = reactive({
  id: '', name: '', tag: '', level: 1, spec: '', protocol: 2, http_method: 1,
  command: '', timeout: 0, multi: 2, retry_times: 0, retry_interval: 0,
  notify_status: 1, notify_type: 2, notify_receiver_id: '', notify_keyword: '',
  dependency_status: 1, dependency_task_id: '', remark: '', request_params: ''
})

const rules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  spec: [{ required: true, message: '请输入crontab表达式', trigger: 'blur' }],
  command: [{ required: true, message: '请输入命令', trigger: 'blur' }],
  timeout: [{ type: 'number', message: '请输入数字', trigger: 'blur' }],
}

watch(() => form.spec, val => {
  cronPreview.value = ''; cronError.value = ''
  if (!val || !val.trim()) return
  try {
    const interval = parser.parseExpression(val.trim())
    const d = interval.next().toDate()
    const pad = n => String(n).padStart(2, '0')
    cronPreview.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  } catch (e) { cronError.value = e.message }
})

onMounted(() => {
  const id = route.params.id
  if (id) {
    taskService.detail(id, (taskData, hostsData) => {
      hosts.value = hostsData || []
      if (taskData) {
        Object.assign(form, {
          ...taskData,
          multi: taskData.multi ? 2 : 1,
          notify_status: taskData.notify_status + 1,
          notify_type: (taskData.notify_type || 0) + 1
        })
        if (taskData.request_params) jsonText.value = taskData.request_params
      }
    })
  }
})

function submit() {
  formRef.value?.validate(v => {
    if (!v) return
    if (form.protocol === 1 && form.http_method === 2) {
      if (paramMode.value === 'json') {
        try { JSON.parse(jsonText.value); form.request_params = jsonText.value }
        catch(e) { ElMessage.error('JSON格式无效: '+e.message); return }
      } else {
        const obj = {}
        formParams.value.forEach(p => { if (p.key) obj[p.key] = p.value })
        form.request_params = JSON.stringify(obj)
      }
    }
    submitting.value = true
    const data = { ...form, host_id: selectedHosts.value.join(',') }
    taskService.update(data, () => { ElMessage.success('保存成功'); router.push('/dashboard') })
  })
}

function formatJson() {
  try { jsonText.value = JSON.stringify(JSON.parse(jsonText.value), null, 2) }
  catch(e) { ElMessage.warning('JSON格式无效') }
}
</script>

<style scoped>
.edit-page { padding: 28px 32px; max-width: 960px; margin: 0 auto; }
.edit-card { background: var(--color-surface); border-radius: var(--radius-card); padding: 28px 32px; box-shadow: var(--shadow-card); }
.page-title { font-size: 20px; font-weight: 700; margin-bottom: 24px; }
.form-section { margin-bottom: 28px; padding-bottom: 28px; border-bottom: 1px solid var(--color-border); }
.form-section:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.section-label { font-size: 13px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; font-weight: 600; }
.params-section { background: #fafafa; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px; margin-top: 12px; }
.params-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.params-title { font-weight: 600; font-size: 14px; }
.cron-box { border-radius: 10px; padding: 14px 18px; margin-top: 8px; font-size: 13px; }
.cron-box.valid { background: #f0fdf4; border: 1px solid #bbf7d0; display: flex; align-items: center; gap: 12px; }
.cron-box.error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
.cron-main { display: flex; align-items: center; gap: 12px; }
.cron-icon { font-size: 20px; }
.cron-label { font-size: 12px; color: #666; margin-bottom: 2px; }
.cron-time { font-size: 18px; font-weight: 700; color: #16a34a; font-family: monospace; }
.form-actions { border-top: 1px solid var(--color-border); padding-top: 20px; display: flex; gap: 12px; }
</style>
