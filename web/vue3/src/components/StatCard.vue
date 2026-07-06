<template>
  <div class="stat-card" @click="$emit('click')">
    <div class="stat-icon" :style="{ background: colors.bg }"><span class="icon">{{ icon }}</span></div>
    <div class="stat-info">
      <div class="stat-label">{{ label }}</div>
      <div class="stat-value" :style="{ color: colors.text }">{{ value }}</div>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
const props = defineProps({ icon: String, label: String, value: [Number, String], color: { type: String, default: 'primary' } })
defineEmits(['click'])
const colorMap = { primary: { bg: '#e0e7ff', text: '#4f46e5' }, success: { bg: '#d1fae5', text: '#10b981' }, danger: { bg: '#fee2e2', text: '#ef4444' }, info: { bg: '#e0f2fe', text: '#0ea5e9' } }
const colors = computed(() => colorMap[props.color] || colorMap.primary)
</script>
<style scoped>
.stat-card { display: flex; align-items: center; gap: 16px; background: var(--color-surface); border-radius: var(--radius-card); padding: 20px 24px; box-shadow: var(--shadow-card); cursor: pointer; transition: box-shadow 0.2s, transform 0.2s; }
.stat-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-1px); }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
.stat-label { font-size: 12px; color: var(--color-text-muted); margin-bottom: 2px; }
.stat-value { font-size: 26px; font-weight: 700; }
</style>
