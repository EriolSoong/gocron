import request from '@/utils/httpClient'
export default {
  mail(cb) { request.get('/api/system/mail').then(r => cb(r.data)) },
  updateMail(form, cb) { request.post('/api/system/mail/update', form).then(() => cb && cb()) },
  createMailUser(username, email, cb) { request.post('/api/system/mail/user', { username, email }).then(() => cb && cb()) },
  removeMailUser(id, cb) { request.post(`/api/system/mail/user/remove/${id}`).then(() => cb && cb()) },
  feishu(cb) { request.get('/api/system/feishu').then(r => cb(r.data)) },
  updateFeishu(form, cb) { request.post('/api/system/feishu/update', form).then(() => cb && cb()) },
  createFeishuGroup(name, cb) { request.post('/api/system/feishu/group', { name }).then(() => cb && cb()) },
  removeFeishuGroup(id, cb) { request.post(`/api/system/feishu/group/remove/${id}`).then(() => cb && cb()) },
  wecom(cb) { request.get('/api/system/wecom').then(r => cb(r.data)) },
  updateWeCom(form, cb) { request.post('/api/system/wecom/update', form).then(() => cb && cb()) },
  createWeComGroup(name, cb) { request.post('/api/system/wecom/group', { name }).then(() => cb && cb()) },
  removeWeComGroup(id, cb) { request.post(`/api/system/wecom/group/remove/${id}`).then(() => cb && cb()) },
  webhook(cb) { request.get('/api/system/webhook').then(r => cb(r.data)) },
  updateWebHook(form, cb) { request.post('/api/system/webhook/update', form).then(() => cb && cb()) },
}
