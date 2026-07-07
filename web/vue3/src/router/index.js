import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import Dashboard from '@/pages/dashboard/index.vue'
import TaskEdit from '@/pages/task/edit.vue'
import TaskLog from '@/pages/taskLog/list.vue'
import HostList from '@/pages/host/list.vue'
import HostEdit from '@/pages/host/edit.vue'
import UserLogin from '@/pages/user/login.vue'
import UserList from '@/pages/user/list.vue'
import UserEdit from '@/pages/user/edit.vue'
import UserEditPassword from '@/pages/user/editPassword.vue'
import EditMyPassword from '@/pages/user/editMyPassword.vue'
import NotificationEmail from '@/pages/system/notification/email.vue'
import NotificationFeishu from '@/pages/system/notification/feishu.vue'
import NotificationWecom from '@/pages/system/notification/wecom.vue'
import NotificationWebhook from '@/pages/system/notification/webhook.vue'
import LoginLog from '@/pages/loginLog/list.vue'
import Install from '@/pages/install/index.vue'
import NotFound from '@/components/NotFound.vue'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'dashboard', component: Dashboard },
  { path: '/task/create', name: 'task-create', component: TaskEdit },
  { path: '/task/edit/:id', name: 'task-edit', component: TaskEdit },
  { path: '/task/log', name: 'task-log', component: TaskLog },
  { path: '/host', name: 'host-list', component: HostList },
  { path: '/host/create', name: 'host-create', component: HostEdit },
  { path: '/host/edit/:id', name: 'host-edit', component: HostEdit },
  { path: '/user/login', name: 'user-login', component: UserLogin, meta: { noLogin: true } },
  { path: '/user', name: 'user-list', component: UserList },
  { path: '/user/create', name: 'user-create', component: UserEdit },
  { path: '/user/edit/:id', name: 'user-edit', component: UserEdit },
  { path: '/user/edit-password/:id', name: 'user-edit-password', component: UserEditPassword },
  { path: '/user/edit-my-password', name: 'user-edit-my-password', component: EditMyPassword },
  { path: '/system/notification', redirect: '/system/notification/email' },
  { path: '/system/notification/email', name: 'notify-email', component: NotificationEmail },
  { path: '/system/notification/feishu', name: 'notify-feishu', component: NotificationFeishu },
  { path: '/system/notification/wecom', name: 'notify-wecom', component: NotificationWecom },
  { path: '/system/notification/webhook', name: 'notify-webhook', component: NotificationWebhook },
  { path: '/system/login-log', name: 'login-log', component: LoginLog },
  { path: '/install', name: 'install', component: Install, meta: { noLogin: true } },
  { path: '/:pathMatch(.*)*', component: NotFound, meta: { noLogin: true } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

let installChecked = false
let isInstalled = true

router.beforeEach(async (to, from, next) => {
  // 安装检测必须在所有路由之前
  if (!installChecked && to.path !== '/install') {
    try {
      const resp = await fetch('/api/install/status')
      const json = await resp.json()
      isInstalled = json.data !== false
      installChecked = true
      if (!isInstalled) {
        next({ path: '/install', replace: true })
        return
      }
    } catch (e) {
      installChecked = true
    }
  }

  if (to.path === '/install') {
    next(); return
  }

  if (to.meta.noLogin) { next(); return }
  const store = useUserStore()
  if (store.isLoggedIn) { next(); return }
  next({ path: '/user/login', query: { redirect: to.fullPath } })
})

export default router
