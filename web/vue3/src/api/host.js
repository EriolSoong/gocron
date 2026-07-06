import request from '@/utils/httpClient'
export default {
  list(params, cb) { request.get('/api/host', { params }).then(r => cb(r)) },
  detail(id, cb) { request.get(`/api/host/${id}`).then(r => cb(r.data)) },
  update(form, cb) { request.post('/api/host/store', form).then(() => cb && cb()) },
  remove(id, cb) { request.post(`/api/host/remove/${id}`).then(() => cb && cb()) },
  ping(id, cb) { request.get(`/api/host/ping/${id}`).then(() => cb && cb()) },
  all(cb) { request.get('/api/host/all').then(r => cb(r.data)) },
}
