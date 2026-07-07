import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  timeout: 30000,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
})

let store = null
export function initStore(s) { store = s }

// POST 请求默认用表单格式，gocron 后端 go-macaron binding 只解析 x-www-form-urlencoded
// 并自动附加 Auth-Token 请求头
request.interceptors.request.use(config => {
  if (store && store.token) {
    config.headers['Auth-Token'] = store.token
  }
  if (config.method === 'post' && config.data && !(config.data instanceof FormData) && typeof config.data === 'object') {
    config.data = new URLSearchParams(config.data)
    config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
  }
  return config
})

request.interceptors.response.use(
  response => {
    const body = response.data
    // gocron API: code===0 表示成功, code===1 表示失败
    if (body.code === 0 || body.message === '' || body.code === undefined) {
      // 解包 {code, message, data} 顶层，只返回实际 payload
      if (body && typeof body === 'object' && 'data' in body) {
        return body.data
      }
      return body
    }
    ElMessage.error(body.message || '请求失败')
    return Promise.reject(body)
  },
  error => {
    if (error.response && error.response.status === 401) {
      window.location.href = '/user/login'
      return Promise.reject(error)
    }
    ElMessage.error(error.message || '网络错误')
    return Promise.reject(error)
  }
)

export default request
