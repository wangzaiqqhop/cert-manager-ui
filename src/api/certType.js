import api from './axios'

export const certTypeApi = {
  list() { return api.get('/cert-types') },
  create(data) { return api.post('/cert-types', data) },
  update(id, data) { return api.put(`/cert-types/${id}`, data) },
  remove(id) { return api.delete(`/cert-types/${id}`) }
}
