import request from '@/utils/httpClient'
export default {
  status(cb) { request.get('/api/install/status').then(r => cb(r)) },
  store(form, onSuccess) {
    const params = new URLSearchParams(form)
    return request.post('/api/install/store', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }).then(() => {
      if (onSuccess) onSuccess()
    })
  },
}
