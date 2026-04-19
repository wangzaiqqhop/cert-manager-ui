import api from './axios'

export const authApi = {
  login(username, password) {
    return api.post('/auth/login', { username, password })
  },
  getMe() {
    return api.get('/auth/me')
  }
}
