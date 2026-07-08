import request from '@/utils/httpClient'
export default {
  list(params, cb) { request.get('/api/task', { params }).then(r => cb(r)) },
  detail(id, cb) { request.get(`/api/task/${id}`).then(r => cb(r, r.hosts || [])) },
  update(form, cb) { request.post('/api/task/store', form).then(() => cb && cb()) },
  run(id, cb) { request.get(`/api/task/run/${id}`).then(() => cb && cb()) },
  remove(id, cb) { request.post(`/api/task/remove/${id}`).then(() => cb && cb()) },
  enable(id) { return request.post(`/api/task/enable/${id}`) },
  disable(id) { return request.post(`/api/task/disable/${id}`) },
  stats(cb) { request.get('/api/dashboard/stats').then(r => cb(r)) },
}
