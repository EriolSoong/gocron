import request from '@/utils/httpClient'
export default {
  list(params, cb) { request.get('/api/task/log', { params }).then(r => cb(r)) },
  clear(cb) { request.post('/api/task/log/clear').then(() => cb && cb()) },
  stop(id, taskId, cb) { request.post('/api/task/log/stop', { id, task_id: taskId }).then(() => cb && cb()) },
  remove(id, cb) { request.post(`/api/v1/tasklog/remove/${id}`).then(() => cb && cb()) },
}
