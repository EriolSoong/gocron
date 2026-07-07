<template>
  <div class="install-wrapper">
    <div class="install-card">
      <div class="install-header">
        <div class="install-logo">⚡</div>
        <h1>系统初始化</h1>
        <p>配置数据库并创建管理员账号</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <div class="section-title">🗄 数据库连接</div>

        <el-form-item label="数据库类型" prop="db_type">
          <el-select v-model="form.db_type" @change="updatePort" style="width:100%">
            <el-option value="mysql">🐬 MySQL</el-option>
            <el-option value="postgres">🐘 PostgreSQL</el-option>
          </el-select>
        </el-form-item>

        <el-row :gutter="24">
          <el-col :span="14">
            <el-form-item label="主机地址" prop="db_host">
              <el-input v-model="form.db_host" placeholder="127.0.0.1" />
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

        <div class="section-title" style="margin-top:28px">👤 管理员账号</div>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="管理员账号" prop="admin_username">
              <el-input v-model="form.admin_username" placeholder="如: admin" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="admin_email">
              <el-input v-model="form.admin_email" placeholder="admin@example.com" />
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

        <div class="form-footer">
          <el-button type="primary" size="large" @click="submit" :loading="submitting">开始安装</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import installService from '@/api/install'

const router = useRouter()
const formRef = ref(null)
const submitting = ref(false)

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
  db_name: [{ required: true, message: '请输入数据库名', trigger: 'blur' }],
  admin_username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  admin_email: [{ type: 'email', required: true, message: '请输入有效邮箱', trigger: 'blur' }],
  admin_password: [{ required: true, min: 6, message: '至少6个字符', trigger: 'blur' }],
  confirm_admin_password: [{ required: true, min: 6, message: '至少6个字符', trigger: 'blur' }],
}

function updatePort(t) {
  form.db_port = t === 'mysql' ? 3306 : 5432
}

async function submit() {
  if (!formRef.value) return
  try {
    // 使用 Promise 版本的 validate
    await formRef.value.validate()
    if (form.admin_password !== form.confirm_admin_password) {
      ElMessage.warning('两次密码不一致')
      return
    }
    submitting.value = true
    installService.store({ ...form }, () => {
      setTimeout(() => {
        ElMessage.success('安装成功！')
        router.push('/user/login')
      }, 1000)
    }).catch(() => {
      submitting.value = false
    })
  } catch (e) {
    // 验证失败，Element Plus 会自动显示错误消息
  }
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
  padding: 40px 44px;
  width: 720px;
  max-width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  max-height: 90vh;
  overflow-y: auto;
}

.install-header {
  text-align: center;
  margin-bottom: 28px;
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

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--color-border);
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}
</style>
