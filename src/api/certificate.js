import api from './axios'

export const certificateApi = {
  list(params) {
    return api.get('/certificates', { params })
  },
  getById(id) {
    return api.get(`/certificates/${id}`)
  },
  create(formData) {
    return api.post('/certificates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  update(id, data) {
    const formData = new FormData()
    Object.entries(data).forEach(([k, v]) => formData.append(k, v ?? ''))
    return api.put(`/certificates/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  remove(id) {
    return api.delete(`/certificates/${id}`)
  },
  addFile(certificateId, file) {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/certificates/${certificateId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  removeFile(certificateId, fileType) {
    return api.delete(`/certificates/${certificateId}/files/${fileType}`)
  },
  getExpiring(days = 30) {
    return api.get('/certificates/expiring', { params: { days } })
  },
  download(id, type, watermark) {
    return api.get(`/certificates/${id}/download`, {
      params: { type, watermark },
      responseType: 'blob'
    })
  },
  preview(id, type) {
    return api.get(`/certificates/${id}/preview`, {
      params: type ? { type } : {},
      responseType: 'blob'
    })
  },
  getChangeHistory(certId, params) {
    return api.get(`/certificates/${certId}/change-history`, { params })
  },
  previewHistoryFile(historyId) {
    return api.get(`/certificates/history-file/${historyId}`, { responseType: 'blob' })
  },
  previewHistoryNewFile(historyId) {
    return api.get(`/certificates/history-file/${historyId}/new`, { responseType: 'blob' })
  },
  importExcel(file) {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/certificates/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  listRecycleBin(params) {
    return api.get('/certificates/recycle-bin', { params })
  },
  restore(id) {
    return api.put(`/certificates/${id}/restore`)
  },
  permanentDelete(id) {
    return api.delete(`/certificates/${id}/permanent`)
  },
  emailLogs(params) { return api.get('/certificates/email-logs', { params }) },
  downloadTemplate() {
    return api.get('/certificates/import/template', { responseType: 'blob' })
  },
  stats() {
    return api.get('/certificates/stats')
  },
  checkDuplicate(data) {
    return api.post('/certificates/check-duplicate', data)
  },
  importFiles(files) {
    const formData = new FormData()
    files.forEach(f => formData.append('files', f))
    return api.post('/certificates/import-files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  queryByNames(data) {
    return api.post('/certificates/query-by-names', data)
  },
  listNames() {
    return api.get('/certificates/names')
  },
  batchDownload(data) {
    return api.post('/certificates/batch-download', data, {
      responseType: 'blob'
    })
  }
}
