import api from './axios'

export const auditApi = {
  list(params) {
    return api.get('/audit-logs', { params })
  },
  exportExcel(params) {
    return api.get('/audit-logs/export', { params, responseType: 'blob' })
  }
}
