import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  timeout: 30000,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
})

let store = null
export function initStore(s) { store = s }

// POST 请求默认用表单格式，gocron 后端 go-macaron binding 只解析 x-www-form-urlencoded
request.interceptors.request.use(config => {
  if (config.method === 'post' && config.data && !(config.data instanceof FormData) && typeof config.data === 'object') {
    config.data = new URLSearchParams(config.data)
    config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
  }
  return config
})

request.interceptors.response.use(
  response => {
    const data = response.data
    // gocron API: code===0 表示成功, code===1 表示失败
    if (data.code === 0 || data.message === '' || data.code === undefined) {
      return data
    }
    ElMessage.error(data.message || '请求失败')
    return Promise.reject(data)
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
