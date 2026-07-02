import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../auth/AuthContext'
import type { Garden } from './types'

export function GardensListPage() {
  const { user, logout } = useAuth()
  const [gardens, setGardens] = useState<Garden[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    loadGardens()
  }, [])

  function loadGardens() {
    setIsLoading(true)
    api
      .get<{ gardens: Garden[] }>('/gardens')
      .then((data) => setGardens(data.gardens))
      .finally(() => setIsLoading(false))
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return

    await api.post('/gardens', { name: name.trim(), description: description.trim() })
    setName('')
    setDescription('')
    loadGardens()
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Moje ogrody</h1>
        <div className="page-header-actions">
          <Link to="/species">Biblioteka roślin</Link>
          <Link to="/dane">Eksport / import danych</Link>
          <span>{user?.name}</span>
          <button type="button" onClick={logout} className="secondary">
            Wyloguj
          </button>
        </div>
      </header>

      <form onSubmit={handleCreate} className="inline-form">
        <input
          type="text"
          placeholder="Nazwa nowego ogrodu"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Opis (opcjonalnie)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">Dodaj ogród</button>
      </form>

      {isLoading && <p className="page-status">Wczytywanie…</p>}

      {!isLoading && gardens.length === 0 && (
        <p className="page-status">Nie masz jeszcze żadnego ogrodu - dodaj pierwszy powyżej.</p>
      )}

      <ul className="garden-list">
        {gardens.map((garden) => (
          <li key={garden.id}>
            <Link to={`/gardens/${garden.id}`}>{garden.name}</Link>
            {garden.description && <p className="garden-description">{garden.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}
