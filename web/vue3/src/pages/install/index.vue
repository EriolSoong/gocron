<template>
  <div class="install-wrapper">
    <div class="install-card">
      <div class="install-header">
        <div class="install-logo">⚡</div>
        <h1>系统初始化</h1>
        <p>配置数据库并创建管理员账号</p>
      </div>

      <el-steps :active="step" align-center class="install-steps">
        <el-step title="数据库配置" />
        <el-step title="管理员账号" />
        <el-step title="完成安装" />
      </el-steps>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="install-form">
        <!-- 步骤 1: 数据库配置 -->
        <div v-show="step === 0" class="step-content">
          <div class="section-title">🗄 数据库连接</div>

          <el-form-item label="数据库类型" prop="db_type">
            <el-select v-model="form.db_type" @change="updatePort" style="width:100%">
              <el-option label="MySQL" value="mysql">
                <span style="margin-right:8px">🐬</span> MySQL
              </el-option>
              <el-option label="PostgreSQL" value="postgres">
                <span style="margin-right:8px">🐘</span> PostgreSQL
              </el-option>
            </el-select>
          </el-form-item>

          <el-row :gutter="24">
            <el-col :span="14">
              <el-form-item label="主机地址" prop="db_host">
                <el-input v-model="form.db_host" placeholder="127.0.0.1">
                  <template #prefix><el-icon><Monitor /></el-icon></template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="10">
              <el-form-item label="端口" prop="db_port">
                <el-input v-model.number="form.db_port" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="用户名" prop="db_username">
                <el-input v-model="form.db_username" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="密码" prop="db_password">
                <el-input v-model="form.db_password" type="password" show-password />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="24">
            <el-col :span="14">
              <el-form-item label="数据库名称" prop="db_name">
                <el-input v-model="form.db_name" placeholder="需提前创建" />
              </el-form-item>
            </el-col>
            <el-col :span="10">
              <el-form-item label="表前缀">
                <el-input v-model="form.db_table_prefix" placeholder="可选" />
              </el-form-item>
            </el-col>
          </el-row>

          <div class="step-actions">
            <el-button type="primary" size="large" @click="nextStep">下一步</el-button>
          </div>
        </div>

        <!-- 步骤 2: 管理员账号 -->
        <div v-show="step === 1" class="step-content">
          <div class="section-title">👤 管理员账号</div>

          <el-alert
            title="创建系统超级管理员账号，安装完成后可使用此账号登录"
            type="info"
            :closable="false"
            show-icon
            style="margin-bottom:20px"
          />

          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="管理员账号" prop="admin_username">
                <el-input v-model="form.admin_username" placeholder="如: admin">
                  <template #prefix><el-icon><User /></el-icon></template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="邮箱" prop="admin_email">
                <el-input v-model="form.admin_email" placeholder="admin@example.com">
                  <template #prefix><el-icon><Message /></el-icon></template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="密码" prop="admin_password">
                <el-input v-model="form.admin_password" type="password" show-password />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="确认密码" prop="confirm_admin_password">
                <el-input v-model="form.confirm_admin_password" type="password" show-password />
              </el-form-item>
            </el-col>
          </el-row>

          <div class="step-actions">
            <el-button @click="step = 0" size="large">上一步</el-button>
            <el-button type="primary" size="large" @click="submit" :loading="submitting">开始安装</el-button>
          </div>
        </div>

        <!-- 步骤 3: 安装中/完成 -->
        <div v-show="step === 2" class="step-content">
          <div class="install-success">
            <div class="success-icon">✅</div>
            <h2>安装完成！</h2>
            <p>正在跳转到登录页...</p>
          </div>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Monitor, User, Message } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import installService from '@/api/install'

const router = useRouter()
const formRef = ref(null)
const submitting = ref(false)
const step = ref(0)

const form = reactive({
  db_type: 'mysql',
  db_host: '127.0.0.1',
  db_port: 3306,
  db_username: '',
  db_password: '',
  db_name: '',
  db_table_prefix: '',
  admin_username: '',
  admin_password: '',
  confirm_admin_password: '',
  admin_email: '',
})

const rules = {
  db_type: [{ required: true, message: '请选择数据库', trigger: 'blur' }],
  db_host: [{ required: true, message: '请输入主机名', trigger: 'blur' }],
  db_port: [{ type: 'number', required: true, message: '请输入端口', trigger: 'blur' }],
  db_username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  db_password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  db_name: [{ required: true, message: '请输入数据库名', trigger: 'blur' }],
  admin_username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  admin_email: [{ type: 'email', required: true, message: '请输入有效邮箱', trigger: 'blur' }],
  admin_password: [{ required: true, min: 6, message: '至少6个字符', trigger: 'blur' }],
  confirm_admin_password: [{ required: true, min: 6, message: '至少6个字符', trigger: 'blur' }],
}

function updatePort(t) {
  form.db_port = t === 'mysql' ? 3306 : 5432
}

function nextStep() {
  formRef.value?.validateField(['db_type', 'db_host', 'db_port', 'db_username', 'db_password', 'db_name'], (valid) => {
    if (valid) step.value = 1
  })
}

function submit() {
  formRef.value?.validate(valid => {
    if (!valid) return
    if (form.admin_password !== form.confirm_admin_password) {
      ElMessage.warning('两次密码不一致')
      return
    }
    submitting.value = true
    step.value = 2
    installService.store({ ...form }, () => {
      setTimeout(() => {
        ElMessage.success('安装成功！')
        router.push('/user/login')
      }, 1000)
    }).catch(() => {
      submitting.value = false
      step.value = 1
    })
  })
}
</script>

<style scoped>
.install-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
}

.install-card {
  background: #fff;
  border-radius: 16px;
  padding: 48px 44px;
  width: 680px;
  max-width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.install-header {
  text-align: center;
  margin-bottom: 36px;
}

.install-logo {
  font-size: 40px;
  margin-bottom: 8px;
}

.install-header h1 {
  font-size: 26px;
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0;
}

.install-header p {
  font-size: 14px;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.install-steps {
  margin-bottom: 36px;
}

.step-content {
  min-height: 280px;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--color-border);
}

.step-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}

.install-success {
  text-align: center;
  padding: 40px 0;
}

.success-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.install-success h2 {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.install-success p {
  color: var(--color-text-muted);
}
</style>
