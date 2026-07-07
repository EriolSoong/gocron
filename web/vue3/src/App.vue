<template>
  <div id="gocron-app">
    <AppHeader v-if="!$route.meta?.noLogin" />
    <main class="main-content"><router-view /></main>
  </div>
</template>
<script setup>
import AppHeader from '@/components/AppHeader.vue'
</script>
<style scoped>
.main-content { min-height: calc(100vh - 60px); }
</style>
