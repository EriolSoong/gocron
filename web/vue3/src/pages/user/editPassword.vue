<template>
  <div class="page"><div class="page-card" style="max-width:500px">
    <h2 style="margin-bottom:20px">修改用户密码</h2>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="新密码" prop="password"><el-input v-model="form.password" type="password" /></el-form-item>
      <el-form-item><el-button type="primary" @click="submit" :loading="submitting">保存</el-button><el-button @click="$router.push('/user')">取消</el-button></el-form-item>
    </el-form>
  </div></div>
</template>
<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import userService from '@/api/user'

const router = useRouter(); const route = useRoute()
const formRef = ref(null); const submitting = ref(false)
const form = reactive({ password: '' })
const rules = { password: [{ required: true, min: 6, message: '密码至少6位', trigger: 'blur' }] }

function submit() {
  formRef.value?.validate(v => {
    if (!v) return; submitting.value = true
    userService.editPassword(route.params.id, form.password, () => { ElMessage.success('修改成功'); router.push('/user') })
  })
}
</script>
<style scoped>
.page { padding: 28px 32px; max-width: 1200px; margin: 0 auto; }
.page-card { background: var(--color-surface); border-radius: var(--radius-card); padding: 24px; box-shadow: var(--shadow-card); }
</style>
