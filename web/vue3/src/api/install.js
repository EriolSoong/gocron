import request from '@/utils/httpClient'
export default {
  status(cb) { request.get('/api/install/status').then(r => cb(r)) },
  store(form, cb) { request.post('/api/install/store', form).then(() => cb && cb()) },
}
