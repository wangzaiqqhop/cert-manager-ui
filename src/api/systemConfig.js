import api from './axios'
export const configApi = {
  list() { return api.get('/system-config') },
  update(data) { return api.put('/system-config', data) }
}
