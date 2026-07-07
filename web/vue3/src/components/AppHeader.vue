<template>
  <header class="app-header">
    <div class="header-inner">
      <div class="header-left">
        <router-link to="/dashboard" class="logo-link"><span class="logo">⚡ gocron</span></router-link>
        <nav class="nav-links">
          <router-link to="/dashboard" class="nav-link" :class="{active: $route.path.startsWith('/dashboard') || $route.path.startsWith('/task')}">任务管理</router-link>
          <router-link to="/host" class="nav-link" :class="{active: $route.path.startsWith('/host')}">任务节点</router-link>
          <router-link v-if="userStore.isAdmin" to="/user" class="nav-link" :class="{active: $route.path.startsWith('/user') && !$route.path.includes('/login')}">用户管理</router-link>
          <router-link v-if="userStore.isAdmin" to="/system/notification/email" class="nav-link" :class="{active: $route.path.startsWith('/system')}">系统管理</router-link>
        </nav>
      </div>
      <div class="header-right">
        <el-dropdown trigger="click" @command="handleCommand">
          <span class="user-info">
            <el-avatar :size="32" style="background:var(--color-primary)">{{ userStore.username?.charAt(0)?.toUpperCase() }}</el-avatar>
            <span class="username">{{ userStore.username }}</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="password"><el-icon><Lock /></el-icon> 修改密码</el-dropdown-item>
              <el-dropdown-item command="logout" divided><el-icon><SwitchButton /></el-icon> 退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </header>
</template>
<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
const router = useRouter()
const userStore = useUserStore()
function handleCommand(cmd) {
  if (cmd === 'password') router.push('/user/edit-my-password')
  else if (cmd === 'logout') { userStore.logout(); router.push('/user/login') }
}
</script>
<style scoped>
.app-header { height: 60px; background: #fff; border-bottom: 1px solid var(--color-border); position: sticky; top: 0; z-index: 100; }
.header-inner { max-width: 1400px; margin: 0 auto; height: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; }
.header-left { display: flex; align-items: center; gap: 40px; }
.logo-link { text-decoration: none; }
.logo { font-size: 18px; font-weight: 800; color: var(--color-primary); }
.nav-links { display: flex; gap: 4px; }
.nav-link { padding: 0 16px; height: 60px; line-height: 60px; color: var(--color-text-secondary); text-decoration: none; font-size: 14px; border-bottom: 2px solid transparent; transition: all 0.2s; }
.nav-link:hover { color: var(--color-primary); }
.nav-link.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 600; }
.user-info { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 8px; border-radius: var(--radius-base); }
.user-info:hover { background: var(--color-background); }
.username { font-size: 14px; color: var(--color-text-primary); }
</style>
