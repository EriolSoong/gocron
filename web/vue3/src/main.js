import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/user'
import { initStore } from './utils/httpClient'
import './styles/global.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// 让 httpClient 可以访问 userStore，自动附加 Auth-Token
const userStore = useUserStore()
initStore(userStore)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.use(router)
app.use(ElementPlus)
app.mount('#app')
