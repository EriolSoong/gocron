<template>
  <header class="app-header">
    <div class="header-inner">
      <div class="header-left">
        <router-link to="/dashboard" class="logo-link"><span class="logo">⚡ gocron</span></router-link>
        <nav class="nav-links">
          <router-link to="/dashboard" class="nav-link" :class="{active: $route.path.startsWith('/dashboard') || ($route.path.startsWith('/task') && !$route.path.startsWith('/task/log'))}">任务管理</router-link>
          <router-link to="/task/log" class="nav-link" :class="{active: $route.path.startsWith('/task/log')}">任务日志</router-link>
          <router-link to="/host" class="nav-link" :class="{active: $route.path.startsWith('/host')}">任务节点</router-link>
          <router-link v-if="userStore.isAdmin" to="/user" class="nav-link" :class="{active: $route.path.startsWith('/user') && !$route.path.includes('/login')}">用户管理</router-link>
          <router-link v-if="userStore.isAdmin" to="/system/notification/email" class="nav-link" :class="{active: $route.path.startsWith('/system')}">系统管理</router-link>
        </nav>
      </div>
      <div class="header-right">
        <el-button class="hamburger-btn" text @click="drawerVisible = true">
          <el-icon :size="22"><Menu /></el-icon>
        </el-button>
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
    <el-drawer v-model="drawerVisible" direction="ltr" size="260px" :with-header="false">
      <div class="drawer-logo"><span>⚡ gocron</span></div>
      <nav class="drawer-nav">
        <router-link to="/dashboard" class="drawer-link" :class="{active: $route.path.startsWith('/dashboard') || ($route.path.startsWith('/task') && !$route.path.startsWith('/task/log'))}" @click="drawerVisible = false">📋 任务管理</router-link>
        <router-link to="/task/log" class="drawer-link" :class="{active: $route.path.startsWith('/task/log')}" @click="drawerVisible = false">📄 任务日志</router-link>
        <router-link to="/host" class="drawer-link" :class="{active: $route.path.startsWith('/host')}" @click="drawerVisible = false">🖥 任务节点</router-link>
        <router-link v-if="userStore.isAdmin" to="/user" class="drawer-link" :class="{active: $route.path.startsWith('/user') && !$route.path.includes('/login')}" @click="drawerVisible = false">👥 用户管理</router-link>
        <router-link v-if="userStore.isAdmin" to="/system/notification/email" class="drawer-link" :class="{active: $route.path.startsWith('/system')}" @click="drawerVisible = false">⚙ 系统管理</router-link>
      </nav>
    </el-drawer>
  </header>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Menu } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
const router = useRouter()
const userStore = useUserStore()
const drawerVisible = ref(false)
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

/* 汉堡按钮默认隐藏 */
.hamburger-btn { display: none; }

/* 侧滑菜单 */
.drawer-logo { padding: 20px 20px 16px; font-size: 18px; font-weight: 800; color: var(--color-primary); border-bottom: 1px solid var(--color-border); margin-bottom: 8px; }
.drawer-nav { display: flex; flex-direction: column; gap: 2px; padding: 0 12px; }
.drawer-link { display: block; padding: 12px 12px; border-radius: 8px; color: var(--color-text-primary); text-decoration: none; font-size: 15px; transition: background 0.15s; }
.drawer-link:hover { background: var(--color-background); }
.drawer-link.active { background: var(--color-primary-light); color: var(--color-primary); font-weight: 600; }

/* 平板：缩小导航间距 */
@media (max-width: 1023px) {
  .header-inner { padding: 0 16px; }
  .header-left { gap: 20px; }
  .nav-link { padding: 0 10px; font-size: 13px; }
}

/* 手机：导航隐藏，显示汉堡 */
@media (max-width: 767px) {
  .nav-links { display: none; }
  .hamburger-btn { display: inline-flex; }
  .header-inner { padding: 0 16px; }
  .header-left { gap: 12px; }
  .username { display: none; }
}
</style>
