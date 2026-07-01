import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, ApiError } from '../../api/client'

export interface User {
  id: number
  email: string
  name: string
}

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Trzymamy zalogowanego użytkownika w jednym miejscu (Context), żeby każdy
// komponent mógł sprawdzić "kto jest zalogowany" bez przekazywania propsów
// przez całe drzewo. Przy starcie aplikacji pytamy backend /auth/me, bo
// jedynym śladem sesji jest cookie w przeglądarce - React sam nic nie wie.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api
      .get<{ user: User }>('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const data = await api.post<{ user: User }>('/auth/login', { email, password })
    setUser(data.user)
  }

  async function register(email: string, password: string, name: string) {
    const data = await api.post<{ user: User }>('/auth/register', { email, password, name })
    setUser(data.user)
  }

  async function logout() {
    await api.post('/auth/logout')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth musi być użyte wewnątrz <AuthProvider>')
  }
  return context
}

export { ApiError }
