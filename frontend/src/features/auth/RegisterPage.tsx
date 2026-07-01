import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, useAuth } from './AuthContext'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await register(email, password, name)
      navigate('/gardens')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nie udało się utworzyć konta')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <h1>Rejestracja</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Imię
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Hasło (min. 8 znaków)
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Tworzenie konta…' : 'Załóż konto'}
        </button>
      </form>
      <p>
        Masz już konto? <Link to="/login">Zaloguj się</Link>
      </p>
    </div>
  )
}
