import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, useAuth } from './AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login(email, password)
      navigate('/gardens')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nie udało się zalogować')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <h1>Logowanie</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Hasło
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logowanie…' : 'Zaloguj się'}
        </button>
      </form>
      <p>
        Nie masz konta? <Link to="/register">Zarejestruj się</Link>
      </p>
    </div>
  )
}
