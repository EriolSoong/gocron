<template>
  <div v-if="total > 0" class="custom-pager">
    <span class="pager-sizes" v-if="showSizes">
      <select :value="pageSize" @change="sizeChanged" class="pager-select">
        <option v-for="s in sizes" :key="s" :value="s">{{ s }}条/页</option>
      </select>
    </span>
    <span class="pager-total">共 {{ totalPages }} 页</span>
    <div class="pager-controls">
      <button class="pager-btn" :disabled="modelValue <= 1" @click="go(modelValue - 1)">‹</button>
      <template v-for="p in pages" :key="p">
        <span v-if="p === '...'" class="pager-ellipsis">...</span>
        <button v-else class="pager-btn" :class="{ active: p === modelValue }" @click="go(p)">{{ p }}</button>
      </template>
      <button class="pager-btn" :disabled="modelValue >= totalPages" @click="go(modelValue + 1)">›</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: 1 },
  total: { type: Number, default: 0 },
  pageSize: { type: Number, default: 20 },
  sizes: { type: Array, default: () => [20, 50, 100] },
  showSizes: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'update:pageSize', 'change'])

const totalPages = computed(() => Math.ceil(props.total / props.pageSize) || 1)

const pages = computed(() => {
  const p = []
  const t = totalPages.value
  const v = props.modelValue
  if (t <= 7) {
    for (let i = 1; i <= t; i++) p.push(i)
    return p
  }
  p.push(1)
  if (v > 3) p.push('...')
  const start = Math.max(2, v - 1)
  const end = Math.min(t - 1, v + 1)
  for (let i = start; i <= end; i++) p.push(i)
  if (v < t - 2) p.push('...')
  p.push(t)
  return p
})

function go(n) {
  if (n >= 1 && n <= totalPages.value) {
    emit('update:modelValue', n)
    emit('change')
  }
}

function sizeChanged(e) {
  emit('update:pageSize', Number(e.target.value))
  emit('change')
}
</script>

<style scoped>
.custom-pager {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  flex-wrap: wrap;
  font-size: 13px;
}

.pager-sizes {
  color: var(--color-text-muted);
}

.pager-total {
  color: var(--color-text-muted);
}

.pager-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pager-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: #555;
  cursor: pointer;
  transition: all 0.15s;
}

.pager-btn:hover:not(:disabled):not(.active) {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.pager-btn.active {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(79,70,229,0.2);
}

.pager-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.pager-ellipsis {
  width: 34px;
  text-align: center;
  font-size: 13px;
  color: #999;
}

.pager-select {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  color: #666;
  background: #fff;
  cursor: pointer;
  outline: none;
}

.pager-select:focus {
  border-color: var(--color-primary);
}
</style>
