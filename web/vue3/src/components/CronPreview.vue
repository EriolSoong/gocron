<template>
  <div v-if="spec" class="cron-preview" :class="{ 'is-valid': !error && nextRun, 'is-error': error }">
    <div v-if="error" class="preview-error"><el-icon><WarningFilled /></el-icon><span>表达式无效：{{ error }}</span></div>
    <div v-else-if="nextRun" class="preview-valid">
      <div class="preview-main"><span class="preview-icon">⏱️</span><div><div class="preview-label">下次执行时间</div><div class="preview-time">{{ nextRun }}</div></div></div>
      <div class="preview-future"><div class="preview-label">后续 {{ nextRuns.length }} 次</div><div class="preview-list"><div v-for="(t, i) in nextRuns" :key="i" class="preview-item">{{ t }}</div></div></div>
    </div>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue'
import { WarningFilled } from '@element-plus/icons-vue'
import parser from 'cron-parser'

const props = defineProps({ spec: { type: String, default: '' } })
const nextRun = ref('')
const nextRuns = ref([])
const error = ref('')

function updatePreview(expr) {
  error.value = ''; nextRun.value = ''; nextRuns.value = []
  if (!expr || !expr.trim()) return
  try {
    const interval = parser.parseExpression(expr.trim())
    nextRun.value = interval.next().toISOString().replace('T', ' ').slice(0, 19)
    const runs = []
    for (let i = 0; i < 5; i++) runs.push(interval.next().toISOString().replace('T', ' ').slice(0, 19))
    nextRuns.value = runs
  } catch (e) { error.value = e.message }
}

watch(() => props.spec, val => { if (val) updatePreview(val) }, { immediate: true })
</script>
<style scoped>
.cron-preview { border-radius: 10px; padding: 14px 18px; margin-bottom: 16px; }
.cron-preview.is-valid { background: #f0fdf4; border: 1px solid #bbf7d0; }
.cron-preview.is-error { background: #fef2f2; border: 1px solid #fecaca; }
.preview-valid { display: flex; align-items: flex-start; gap: 24px; }
.preview-main { display: flex; align-items: center; gap: 12px; }
.preview-icon { font-size: 20px; }
.preview-label { font-size: 12px; color: #666; margin-bottom: 2px; }
.preview-time { font-size: 18px; font-weight: 700; color: #16a34a; font-family: 'SF Mono', Monaco, monospace; }
.preview-list { font-size: 12px; color: #555; font-family: monospace; line-height: 1.8; }
.preview-error { display: flex; align-items: center; gap: 8px; color: #dc2626; font-size: 13px; }
</style>
