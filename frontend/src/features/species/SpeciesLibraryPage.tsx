import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { SpeciesCard } from './SpeciesCard'
import { SpeciesForm, type SpeciesFormValues } from './SpeciesForm'
import type { Species } from './types'

export function SpeciesLibraryPage() {
  const [species, setSpecies] = useState<Species[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isAdding, setIsAdding] = useState(false)

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

  async function handleAddSpecies(values: SpeciesFormValues) {
    await api.post('/species', values)
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
          <SpeciesCard key={s.id} species={s} onChanged={loadSpecies} />
        ))}
      </ul>

      {isAdding ? (
        <SpeciesForm onSubmit={handleAddSpecies} onCancel={() => setIsAdding(false)} />
      ) : (
        <button type="button" onClick={() => setIsAdding(true)}>
          + Dodaj własny gatunek
        </button>
      )}
    </div>
  )
}
