const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export const isApiConfigured = Boolean(apiBaseUrl)

async function request(path, options = {}) {
  if (!isApiConfigured) {
    throw new Error('The registration service is not configured. Please contact the league.')
  }

  const isAdminRequest = options.admin === true || path.startsWith('/admin')

  let response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      credentials: options.credentials ?? 'include',
      headers: {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Could not reach the registration service. Check your connection and try again.')
  }

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(body.message || 'The request could not be completed.')
    error.status = response.status
    error.data = body

    if (
      isAdminRequest &&
      response.status === 401 &&
      typeof window !== 'undefined' &&
      window.location.pathname !== '/admin/login'
    ) {
      window.location.assign('/admin/login')
    }

    throw error
  }

  return body
}

export function createRegistration(payload) {
  return request('/submission', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getReviews({ page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })

  return request(`/reviews?${params.toString()}`)
}

export function addReview(payload) {
  return request('/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function verifyPayment(payment) {
  return request('/payment/verify', {
    method: 'POST',
    body: JSON.stringify(payment),
  })
}

export function adminLogin(payload) {

  return request('/admin/login', {
    method: 'POST',
    admin: true,
    body: JSON.stringify(payload),
  })
}

export function adminSessionActive() {
  return getAdminPlayers({ page: 1, limit: 1 })
}

export function getAdminPlayers({ page = 1, limit = 20, search = '' } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })

  if (search && search.trim()) {
    params.set('search', search.trim())
  }

  return request(`/admin/api/players?${params.toString()}`, {
    method: 'GET',
    admin: true,
  })
}

export function getAdminPlayerById(id) {
  return request(`/admin/api/players/${encodeURIComponent(id)}`, {
    method: 'GET',
    admin: true,
  })
}

export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-razorpay-checkout]')
    if (existingScript) {
      existingScript.addEventListener('load', resolve, { once: true })
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Could not load the secure payment checkout. Please try again.')),
        { once: true }
      )
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.dataset.razorpayCheckout = 'true'
    script.onload = resolve
    script.onerror = () => {
      script.remove()
      reject(new Error('Could not load the secure payment checkout. Please try again.'))
    }
    document.body.appendChild(script)
  })
}