import request from '@/utils/httpClient'
export default {
  list(params, cb) { request.get('/api/user', { params }).then(r => cb(r)) },
  detail(id, cb) { request.get(`/api/user/${id}`).then(r => cb(r.data)) },
  update(form, cb) { request.post('/api/user/store', form).then(() => cb && cb()) },
  remove(id, cb) { request.post(`/api/user/remove/${id}`).then(() => cb && cb()) },
  login(username, password, cb) { request.post('/api/user/login', { username, password }).then(r => cb(r)) },
  enable(id) { request.post(`/api/user/enable/${id}`) },
  disable(id) { request.post(`/api/user/disable/${id}`) },
  editPassword(id, password, cb) { request.post(`/api/user/editPassword/${id}`, { password }).then(() => cb && cb()) },
  editMyPassword(password, cb) { request.post('/api/user/editMyPassword', { password }).then(() => cb && cb()) },
}
