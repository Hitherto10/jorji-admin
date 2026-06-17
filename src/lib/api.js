import { getToken, clearToken } from './auth.js'

const BASE = import.meta.env.VITE_API_URL

async function request(method, path, { body, params } = {}) {
  const token = getToken()
  const url = new URL(`${BASE}${path}`)

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 || res.status === 403) {
    clearToken()
    window.location.reload()
    throw new Error('Session expired — please log in again')
  }

  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
  return json
}

export const api = {
  get:    (path, params) => request('GET',    path, { params }),
  post:   (path, body)   => request('POST',   path, { body }),
  patch:  (path, body, params) => request('PATCH',  path, { body, params }),
  delete: (path, params) => request('DELETE', path, { params }),
}
