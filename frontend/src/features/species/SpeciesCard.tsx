import { useState, type FormEvent } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../auth/AuthContext'
import { SUN_REQUIREMENT_LABELS, type Species, type Variety } from './types'

interface SpeciesCardProps {
  species: Species
  onDeleted: () => void
}

export function SpeciesCard({ species, onDeleted }: SpeciesCardProps) {
  const { user } = useAuth()
  const isOwn = species.owner_id === user?.id

  const [expanded, setExpanded] = useState(false)
  const [varieties, setVarieties] = useState<Variety[] | null>(null)
  const [isAddingVariety, setIsAddingVariety] = useState(false)
  const [varietyName, setVarietyName] = useState('')

  function toggleExpanded() {
    const next = !expanded
    setExpanded(next)
    if (next && varieties === null) {
      loadVarieties()
    }
  }

  function loadVarieties() {
    api
      .get<{ varieties: Variety[] }>(`/species/${species.id}/varieties`)
      .then((data) => setVarieties(data.varieties))
  }

  async function handleAddVariety(event: FormEvent) {
    event.preventDefault()
    if (!varietyName.trim()) return

    await api.post(`/species/${species.id}/varieties`, { name: varietyName.trim() })
    setVarietyName('')
    setIsAddingVariety(false)
    loadVarieties()
  }

  async function handleDeleteVariety(varietyId: number) {
    if (!confirm('Usunąć tę odmianę?')) return
    await api.delete(`/varieties/${varietyId}`)
    loadVarieties()
  }

  async function handleDeleteSpecies() {
    if (!confirm(`Usunąć gatunek "${species.name}"?`)) return
    await api.delete(`/species/${species.id}`)
    onDeleted()
  }

  return (
    <li className="species-card">
      <button type="button" className="species-card-header" onClick={toggleExpanded}>
        <span className="species-color-dot" style={{ background: species.color }} />
        <span className="species-name">{species.name}</span>
        {species.latin_name && <span className="species-latin">({species.latin_name})</span>}
        {!isOwn && <span className="species-badge">systemowy</span>}
      </button>

      {expanded && (
        <div className="species-card-body">
          <dl className="species-details">
            {species.family && (
              <>
                <dt>Rodzina</dt>
                <dd>{species.family}</dd>
              </>
            )}
            {species.spacing_cm && (
              <>
                <dt>Odstęp w rzędzie</dt>
                <dd>{species.spacing_cm} cm</dd>
              </>
            )}
            {species.row_spacing_cm && (
              <>
                <dt>Odstęp między rzędami</dt>
                <dd>{species.row_spacing_cm} cm</dd>
              </>
            )}
            {species.depth_cm && (
              <>
                <dt>Głębokość siewu</dt>
                <dd>{species.depth_cm} cm</dd>
              </>
            )}
            {species.sun_requirement && (
              <>
                <dt>Stanowisko</dt>
                <dd>{SUN_REQUIREMENT_LABELS[species.sun_requirement]}</dd>
              </>
            )}
          </dl>

          <h4>Odmiany</h4>
          {varieties === null && <p className="page-status">Wczytywanie…</p>}
          {varieties !== null && varieties.length === 0 && (
            <p className="page-status">Brak odmian - dodaj pierwszą poniżej.</p>
          )}
          <ul className="variety-list">
            {varieties?.map((variety) => (
              <li key={variety.id}>
                <span>{variety.name}</span>
                {variety.owner_id === user?.id && (
                  <button type="button" className="danger small" onClick={() => handleDeleteVariety(variety.id)}>
                    Usuń
                  </button>
                )}
              </li>
            ))}
          </ul>

          {isAddingVariety ? (
            <form onSubmit={handleAddVariety} className="inline-form">
              <input
                type="text"
                placeholder="Nazwa odmiany"
                value={varietyName}
                onChange={(e) => setVarietyName(e.target.value)}
                required
              />
              <button type="submit">Dodaj</button>
              <button type="button" className="secondary" onClick={() => setIsAddingVariety(false)}>
                Anuluj
              </button>
            </form>
          ) : (
            <button type="button" className="secondary" onClick={() => setIsAddingVariety(true)}>
              + Dodaj odmianę
            </button>
          )}

          {isOwn && (
            <button type="button" className="danger" onClick={handleDeleteSpecies}>
              Usuń gatunek
            </button>
          )}
        </div>
      )}
    </li>
  )
}
