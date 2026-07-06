import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  timeout: 30000,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
})

let store = null
export function initStore(s) { store = s }

request.interceptors.response.use(
  response => {
    const data = response.data
    if (data.code === 200 || data.message === '' || data.code === undefined) {
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
