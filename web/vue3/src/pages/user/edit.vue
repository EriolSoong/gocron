<template>
  <div class="page"><div class="page-card" style="max-width:600px">
    <h2 style="margin-bottom:20px">{{ isEdit ? '编辑用户' : '新增用户' }}</h2>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="用户名" prop="name"><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="邮箱" prop="email"><el-input v-model="form.email" /></el-form-item>
      <el-form-item label="密码" prop="password" v-if="!isEdit"><el-input v-model="form.password" type="password" /></el-form-item>
      <el-form-item label="角色"><el-select v-model="form.is_admin" style="width:100%"><el-option :value="1" label="管理员" /><el-option :value="0" label="普通用户" /></el-select></el-form-item>
      <el-form-item><el-button type="primary" @click="submit" :loading="submitting">保存</el-button><el-button @click="$router.push('/user')">取消</el-button></el-form-item>
    </el-form>
  </div></div>
</template>
<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import userService from '@/api/user'

const router = useRouter(); const route = useRoute()
const formRef = ref(null); const submitting = ref(false)
const isEdit = computed(() => !!route.params.id)
const form = reactive({ id: '', name: '', email: '', password: '', is_admin: 0 })
const rules = { name: [{ required: true, message: '请输入用户名', trigger: 'blur' }], email: [{ type: 'email', message: '请输入有效邮箱', trigger: 'blur' }], password: [{ required: true, message: '请输入密码', trigger: 'blur' }] }

onMounted(() => { if (isEdit.value) userService.detail(route.params.id, data => { if (data) Object.assign(form, data) }) })

function submit() {
  formRef.value?.validate(v => {
    if (!v) return; submitting.value = true
    userService.update({ ...form }, () => { ElMessage.success('保存成功'); router.push('/user') })
  })
}
</script>
<style scoped>
.page { padding: 28px 32px; max-width: 1200px; margin: 0 auto; }
.page-card { background: var(--color-surface); border-radius: var(--radius-card); padding: 24px; box-shadow: var(--shadow-card); }
</style>
