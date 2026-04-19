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
    return api.put(`/certificates/${id}`, data)
  },
  remove(id) {
    return api.delete(`/certificates/${id}`)
  },
  getExpiring(days = 30) {
    return api.get('/certificates/expiring', { params: { days } })
  },
  download(id) {
    return api.get(`/certificates/${id}/download`, { responseType: 'blob' })
  },
  preview(id) {
    return api.get(`/certificates/${id}/preview`, { responseType: 'blob' })
  }
}
