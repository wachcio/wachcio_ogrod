import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { SpeciesCard } from './SpeciesCard'
import type { Species } from './types'

const DEFAULT_COLOR = '#4caf50'

export function SpeciesLibraryPage() {
  const [species, setSpecies] = useState<Species[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)

  useEffect(() => {
    loadSpecies()
  }, [])

  function loadSpecies() {
    setIsLoading(true)
    api
      .get<{ species: Species[] }>('/species')
      .then((data) => setSpecies(data.species))
      .finally(() => setIsLoading(false))
  }

  async function handleAddSpecies(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return

    await api.post('/species', { name: name.trim(), color })
    setName('')
    setColor(DEFAULT_COLOR)
    setIsAdding(false)
    loadSpecies()
  }

  const filtered = species.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <Link to="/gardens">&larr; Moje ogrody</Link>
          <h1>Biblioteka roślin</h1>
        </div>
      </header>

      <input
        type="text"
        placeholder="Szukaj gatunku…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="species-search"
      />

      {isLoading && <p className="page-status">Wczytywanie…</p>}

      <ul className="species-list">
        {filtered.map((s) => (
          <SpeciesCard key={s.id} species={s} onDeleted={loadSpecies} />
        ))}
      </ul>

      {isAdding ? (
        <form onSubmit={handleAddSpecies} className="bed-form">
          <label>
            Nazwa gatunku
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Kolor na planie
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </label>
          <div className="bed-form-actions">
            <button type="submit">Dodaj gatunek</button>
            <button type="button" className="secondary" onClick={() => setIsAdding(false)}>
              Anuluj
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setIsAdding(true)}>
          + Dodaj własny gatunek
        </button>
      )}
    </div>
  )
}
