import api from './axios'

export const userApi = {
  list(params) {
    return api.get('/users', { params })
  },
  getById(id) {
    return api.get(`/users/${id}`)
  },
  create(data) {
    return api.post('/users', data)
  },
  update(id, data) {
    return api.put(`/users/${id}`, data)
  },
  remove(id) {
    return api.delete(`/users/${id}`)
  },
  resetPassword(id) {
    return api.post(`/users/${id}/reset-password`)
  },
  changePassword(data) {
    return api.put('/users/me/password', data)
  }
}
