<template>
  <div style="margin-bottom:20px">
    <el-tabs v-model="active" @tab-change="changeTab">
      <el-tab-pane label="📧 邮件" name="email" />
      <el-tab-pane label="🐦 飞书" name="feishu" />
      <el-tab-pane label="💬 企业微信" name="wecom" />
      <el-tab-pane label="🔗 Webhook" name="webhook" />
    </el-tabs>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
const router = useRouter(); const route = useRoute()
const segments = route.path.split('/')
const active = ref(segments[segments.length-1] || 'email')

function changeTab(name) { router.push('/system/notification/' + name) }
</script>
