const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

function getToken() {
  try {
    return JSON.parse(localStorage.getItem('electriIncomSession'))?.token || ''
  } catch {
    return ''
  }
}

async function request(path, options = {}) {
  const token = getToken()
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Error al conectar con el servidor')
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export const api = {
  auth: {
    login: (payload) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },
  cashClose: {
    open: (payload) =>
      request('/cash-close', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    close: (payload) =>
      request('/cash-close', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getToday: () => request('/cash-close/today'),
    getReports: () => request('/cash-close/reports'),
  },
  dashboard: {
    get: () => request('/dashboard'),
  },
  products: {
    create: (payload) =>
      request('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    list: (search = '') => request(`/products?search=${encodeURIComponent(search)}`),
    remove: (id) =>
      request(`/products/${id}`, {
        method: 'DELETE',
      }),
    update: (id, payload) =>
      request(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
  },
  sales: {
    create: (payload) =>
      request('/sales', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    list: () => request('/sales'),
  },
  workOrders: {
    create: (payload) =>
      request('/work-orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    get: (id) => request(`/work-orders/${encodeURIComponent(id)}`),
    list: (search = '', status = '') => {
      const queryParts = []
      if (search) queryParts.push(`search=${encodeURIComponent(search)}`)
      if (status) queryParts.push(`status=${encodeURIComponent(status)}`)
      const queryString = queryParts.length ? `?${queryParts.join('&')}` : ''
      return request(`/work-orders${queryString}`)
    },
    updateStatus: (id, payload) =>
      request(`/work-orders/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
  },
  users: {
    create: (payload) =>
      request('/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    list: () => request('/users'),
    updateStatus: (id, active) =>
      request(`/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ active }),
      }),
  },
}
