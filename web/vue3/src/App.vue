<template>
  <div id="gocron-app">
    <AppHeader v-if="showHeader" />
    <main class="main-content"><router-view /></main>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import installService from '@/api/install'

const route = useRoute()
const installed = ref(true)
const showHeader = computed(() => !route.meta?.noLogin && installed.value)

// 首次加载时检测安装状态
installService.status((data) => {
  if (!data && route.path !== '/install') {
    router.push('/install')
    installed.value = false
  }
})
</script>
<style scoped>
.main-content { min-height: calc(100vh - 60px); }
</style>
