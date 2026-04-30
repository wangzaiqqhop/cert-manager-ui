import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  {
    path: '/',
    component: () => import('../components/Layout.vue'),
    children: [
      { path: '', redirect: '/certificates' },
      { path: 'certificates', name: 'CertificateList', component: () => import('../views/CertificateList.vue') },
      { path: 'certificates/upload', name: 'CertificateUpload', component: () => import('../views/CertificateUpload.vue') },
      { path: 'certificates/:id', name: 'CertificateDetail', component: () => import('../views/CertificateDetail.vue') },
      { path: 'certificates/:id/edit', name: 'CertificateEdit', component: () => import('../views/CertificateEdit.vue') },
      { path: 'admin/persons', name: 'PersonManage', component: () => import('../views/PersonManage.vue'), meta: { requiresAdmin: true } },
      { path: 'admin/users', name: 'UserManage', component: () => import('../views/UserManage.vue'), meta: { requiresSuperAdmin: true } },
      { path: 'admin/audit-logs', name: 'AuditLog', component: () => import('../views/AuditLog.vue'), meta: { requiresAdmin: true } },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

function getUserRole() {
  try {
    const raw = localStorage.getItem('userInfo')
    if (raw) return JSON.parse(raw).role
  } catch (e) { /* ignore */ }
  return null
}

// Route guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else if (to.meta.requiresSuperAdmin && getUserRole() !== 'SUPER_ADMIN') {
    next('/')
  } else if (to.meta.requiresAdmin) {
    const role = getUserRole()
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') next('/')
    else next()
  } else {
    next()
  }
})

export default router
