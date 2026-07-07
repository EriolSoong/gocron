<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header"><div class="login-logo">⚡</div><h1>gocron</h1><p>定时任务管理系统</p></div>
      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="submit">
        <el-form-item prop="username"><el-input v-model="form.username" placeholder="用户名或邮箱" :prefix-icon="User" size="large" /></el-form-item>
        <el-form-item prop="password"><el-input v-model="form.password" type="password" placeholder="密码" :prefix-icon="Lock" size="large" show-password /></el-form-item>
        <el-form-item><el-button type="primary" native-type="submit" size="large" :loading="loading" style="width:100%">登 录</el-button></el-form-item>
      </el-form>
      <div class="footer">gocron v2.0</div>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import userService from '@/api/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)
const form = reactive({ username: '', password: '' })
const rules = { username: [{ required: true, message: '请输入用户名', trigger: 'blur' }], password: [{ required: true, message: '请输入密码', trigger: 'blur' }] }

function submit() {
  formRef.value?.validate(valid => {
    if (!valid) return
    loading.value = true
    userService.login(form.username, form.password, data => {
      userStore.setUser({ token: data.token, uid: data.uid, username: data.username, is_admin: data.is_admin })
      ElMessage.success('登录成功')
      router.push(route.query.redirect || '/dashboard')
      loading.value = false
    })
  })
}
</script>
<style scoped>
.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.login-card { background: #fff; border-radius: 16px; padding: 48px 40px; width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.login-header { text-align: center; margin-bottom: 36px; }
.login-logo { font-size: 36px; margin-bottom: 8px; }
.login-header h1 { font-size: 24px; font-weight: 800; color: var(--color-text-primary); margin: 0; }
.login-header p { font-size: 13px; color: var(--color-text-muted); margin-top: 4px; }
.footer { text-align: center; margin-top: 24px; font-size: 12px; color: #bbb; }
</style>
