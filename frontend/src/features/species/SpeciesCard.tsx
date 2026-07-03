import { useState } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../auth/AuthContext'
import { SpeciesForm, type SpeciesFormValues } from './SpeciesForm'
import { SUN_REQUIREMENT_LABELS, type Species, type Variety } from './types'
import { VarietyForm, type VarietyFormValues } from './VarietyForm'

interface SpeciesCardProps {
  species: Species
  onChanged: () => void
}

// Odmiana polskiej liczby mnogiej dla komunikatów potwierdzenia usunięcia -
// "1 nasadzenie", "3 nasadzenia", "5 nasadzeń".
function pluralizePlantings(count: number): string {
  if (count === 1) return 'nasadzenie'
  const lastDigit = count % 10
  const lastTwoDigits = count % 100
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwoDigits >= 12 && lastTwoDigits <= 14)) {
    return 'nasadzenia'
  }
  return 'nasadzeń'
}

export function SpeciesCard({ species, onChanged }: SpeciesCardProps) {
  const { user } = useAuth()
  const isOwn = species.owner_id === user?.id

  const [expanded, setExpanded] = useState(false)
  const [isEditingSpecies, setIsEditingSpecies] = useState(false)
  const [varieties, setVarieties] = useState<Variety[] | null>(null)
  const [isAddingVariety, setIsAddingVariety] = useState(false)
  const [editingVariety, setEditingVariety] = useState<Variety | null>(null)

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

  async function handleUpdateSpecies(values: SpeciesFormValues) {
    await api.put(`/species/${species.id}`, values)
    setIsEditingSpecies(false)
    onChanged()
  }

  async function handleDeleteSpecies() {
    // species_id w nasadzeniu jest wymagane, więc usunięcie gatunku zawsze
    // kasuje razem z nim wszystkie nasadzenia, które go używały (patrz
    // SpeciesController::destroy) - ostrzegamy o tym z dokładną liczbą.
    const warning =
      species.planting_count > 0
        ? ` To usunie również ${species.planting_count} ${pluralizePlantings(species.planting_count)} na Twoich grządkach.`
        : ''
    if (!confirm(`Usunąć gatunek "${species.name}"?${warning}`)) return
    await api.delete(`/species/${species.id}`)
    onChanged()
  }

  async function handleAddVariety(values: VarietyFormValues) {
    await api.post(`/species/${species.id}/varieties`, values)
    setIsAddingVariety(false)
    loadVarieties()
  }

  async function handleUpdateVariety(values: VarietyFormValues) {
    if (!editingVariety) return
    await api.put(`/varieties/${editingVariety.id}`, values)
    setEditingVariety(null)
    loadVarieties()
  }

  async function handleDeleteVariety(variety: Variety) {
    // Usunięcie odmiany NIE kasuje nasadzeń (variety_id trafia na NULL) -
    // zostaje sam gatunek, więc komunikat jest łagodniejszy niż przy gatunku.
    const warning =
      variety.planting_count > 0
        ? ` To spowoduje utratę przypisanej odmiany w ${variety.planting_count} ${pluralizePlantings(variety.planting_count)} na Twoich grządkach (sam gatunek pozostanie).`
        : ''
    if (!confirm(`Usunąć odmianę "${variety.name}"?${warning}`)) return
    await api.delete(`/varieties/${variety.id}`)
    loadVarieties()
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
          {isEditingSpecies ? (
            <SpeciesForm
              initialSpecies={species}
              onSubmit={handleUpdateSpecies}
              onCancel={() => setIsEditingSpecies(false)}
            />
          ) : (
            <>
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
                    <div>
                      <span>{variety.name}</span>
                      {(variety.days_to_harvest_min || variety.days_to_harvest_max) && (
                        <span className="variety-detail">
                          {' '}
                          · zbiór po {variety.days_to_harvest_min ?? '?'}–{variety.days_to_harvest_max ?? '?'} dniach
                        </span>
                      )}
                      {variety.seed_source && <span className="variety-detail"> · {variety.seed_source}</span>}
                      {variety.description && <p className="variety-description">{variety.description}</p>}
                    </div>
                    {variety.owner_id === user?.id && (
                      <div className="variety-actions">
                        <button
                          type="button"
                          className="secondary small"
                          onClick={() => {
                            setEditingVariety(variety)
                            setIsAddingVariety(false)
                          }}
                        >
                          Edytuj
                        </button>
                        <button type="button" className="danger small" onClick={() => handleDeleteVariety(variety)}>
                          Usuń
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {editingVariety ? (
                <VarietyForm
                  initialVariety={editingVariety}
                  onSubmit={handleUpdateVariety}
                  onCancel={() => setEditingVariety(null)}
                />
              ) : isAddingVariety ? (
                <VarietyForm onSubmit={handleAddVariety} onCancel={() => setIsAddingVariety(false)} />
              ) : (
                <button type="button" className="secondary" onClick={() => setIsAddingVariety(true)}>
                  + Dodaj odmianę
                </button>
              )}

              {isOwn && (
                <div className="bed-form-actions">
                  <button type="button" className="secondary" onClick={() => setIsEditingSpecies(true)}>
                    Edytuj gatunek
                  </button>
                  <button type="button" className="danger" onClick={handleDeleteSpecies}>
                    Usuń gatunek
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </li>
  )
}
