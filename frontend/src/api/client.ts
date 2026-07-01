const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Cienka warstwa nad fetch: zawsze dołącza cookie sesji (credentials:
// 'include' - inaczej backend nie zobaczy, że jesteśmy zalogowani, bo
// frontend i backend to różne originy) i zamienia błędy HTTP na wyjątki.
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message = data?.error ?? 'Wystąpił nieoczekiwany błąd'
    throw new ApiError(response.status, message)
  }

  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
