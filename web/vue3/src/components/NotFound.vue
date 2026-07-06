<template>
  <div class="not-found"><h1>404</h1><p>页面不存在</p><router-link to="/dashboard"><el-button type="primary">返回首页</el-button></router-link></div>
</template>
<style scoped>
.not-found { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; }
.not-found h1 { font-size: 72px; color: var(--color-primary); margin-bottom: 8px; }
.not-found p { font-size: 18px; color: var(--color-text-muted); margin-bottom: 24px; }
</style>
