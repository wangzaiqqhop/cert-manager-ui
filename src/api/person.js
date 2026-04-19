import api from './axios'

export const personApi = {
  list(params) {
    return api.get('/persons', { params })
  },
  getById(id) {
    return api.get(`/persons/${id}`)
  },
  create(data) {
    return api.post('/persons', data)
  },
  update(id, data) {
    return api.put(`/persons/${id}`, data)
  },
  remove(id) {
    return api.delete(`/persons/${id}`)
  }
}
