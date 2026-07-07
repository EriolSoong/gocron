<template>
  <div class="task-detail">
    <div class="detail-grid">
      <div class="detail-card">
        <span class="detail-icon">📅</span>
        <span class="detail-label">创建时间</span>
        <span class="detail-value">{{ fmt(row.created) }}</span>
      </div>
      <div class="detail-card">
        <span class="detail-icon">🏷</span>
        <span class="detail-label">任务类型</span>
        <span class="detail-value">{{ row.level === 1 ? '主任务' : '子任务' }}</span>
      </div>
      <div class="detail-card">
        <span class="detail-icon">⏱</span>
        <span class="detail-label">超时设置</span>
        <span class="detail-value">{{ row.timeout > 0 ? row.timeout + '秒' : '不限制' }}</span>
      </div>
      <div class="detail-card">
        <span class="detail-icon">🔁</span>
        <span class="detail-label">重试次数</span>
        <span class="detail-value">{{ row.retry_times }}次</span>
      </div>
      <div class="detail-card">
        <span class="detail-icon">🕐</span>
        <span class="detail-label">Cron 表达式</span>
        <span class="detail-value cron">{{ row.spec }}</span>
      </div>
      <div class="detail-card command-card">
        <span class="detail-icon">▶</span>
        <span class="detail-label">执行命令</span>
        <span class="detail-value cmd">{{ row.command || '-' }}</span>
      </div>
      <div v-if="row.remark" class="detail-card remark-card">
        <span class="detail-icon">📝</span>
        <span class="detail-label">备注</span>
        <span class="detail-value">{{ row.remark }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  row: { type: Object, required: true }
})

function fmt(t) {
  if (!t) return '-'
  const d = new Date(t)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
</script>

<style scoped>
.task-detail {
  padding: 16px 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.detail-card {
  background: var(--color-background);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid var(--color-border);
}

.detail-icon {
  font-size: 14px;
}

.detail-label {
  font-size: 11px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.detail-value.cron {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 13px;
  color: var(--color-primary);
}

.detail-value.cmd {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 12px;
  color: var(--color-text-secondary);
  word-break: break-all;
  line-height: 1.4;
}

.command-card {
  grid-column: span 2;
}

.remark-card {
  grid-column: span 2;
}

@media (max-width: 767px) {
  .detail-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .command-card,
  .remark-card {
    grid-column: span 2;
  }

  .detail-card {
    padding: 10px;
  }

  .detail-value {
    font-size: 13px;
  }
}
</style>
