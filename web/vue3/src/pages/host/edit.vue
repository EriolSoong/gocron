<template>
  <div class="page">
    <div class="page-card" style="max-width:600px">
      <h2 style="margin-bottom:20px">{{ isEdit ? '编辑节点' : '新增节点' }}</h2>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="节点名称" prop="alias"><el-input v-model="form.alias" /></el-form-item>
        <el-form-item label="主机名" prop="name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="端口" prop="port"><el-input v-model.number="form.port" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="3" /></el-form-item>
        <el-form-item><el-button type="primary" @click="submit" :loading="submitting">保存</el-button><el-button @click="$router.push('/host')">取消</el-button></el-form-item>
      </el-form>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import hostService from '@/api/host'

const router = useRouter(); const route = useRoute()
const formRef = ref(null); const submitting = ref(false)
const isEdit = computed(() => !!route.params.id)
const form = reactive({ id: '', alias: '', name: '', port: 5921, remark: '' })
const rules = { alias: [{ required: true, message: '请输入节点名称', trigger: 'blur' }], name: [{ required: true, message: '请输入主机名', trigger: 'blur' }], port: [{ type: 'number', required: true, message: '请输入端口', trigger: 'blur' }] }

onMounted(() => {
  if (isEdit.value) {
    hostService.detail(route.params.id, data => { if (data) Object.assign(form, data) })
  }
})

function submit() {
  formRef.value?.validate(v => {
    if (!v) return
    submitting.value = true
    hostService.update({ ...form }, () => { ElMessage.success('保存成功'); router.push('/host') })
  })
}
</script>
<style scoped>
.page { padding: 28px 32px; max-width: 1200px; margin: 0 auto; }
.page-card { background: var(--color-surface); border-radius: var(--radius-card); padding: 24px; box-shadow: var(--shadow-card); }
</style>
