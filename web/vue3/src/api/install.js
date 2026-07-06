import request from '@/utils/httpClient'
export default {
  status(cb) { request.get('/api/install/status').then(r => cb(r)) },
  store(form, onSuccess) {
    return request.post('/api/install/store', form).then(() => {
      if (onSuccess) onSuccess()
    })
  },
}
