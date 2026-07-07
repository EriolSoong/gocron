import request from '@/utils/httpClient'
export default {
  loginLogList(params, cb) { request.get('/api/system/login-log', { params }).then(r => cb(r)) },
}
