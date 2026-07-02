import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import type { Bed } from '../gardens/types'
import type { Species } from '../species/types'
import { PlantingCanvas } from './PlantingCanvas'
import { PlantingForm, type PlantingFormValues } from './PlantingForm'
import type { Planting, PlantingDraft } from './types'

type Mode = 'idle' | 'point' | 'row'

export function BedDetailPage() {
  const { gardenId, bedId } = useParams<{ gardenId: string; bedId: string }>()
  const [bed, setBed] = useState<Bed | null>(null)
  const [plantings, setPlantings] = useState<Planting[]>([])
  const [species, setSpecies] = useState<Species[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [mode, setMode] = useState<Mode>('idle')
  const [draft, setDraft] = useState<PlantingDraft | null>(null)
  const [rotationWarning, setRotationWarning] = useState<string | null>(null)

  useEffect(() => {
    if (!bedId) return
    loadData(bedId)
  }, [bedId])

  function loadData(id: string) {
    setIsLoading(true)
    Promise.all([
      api.get<{ bed: Bed }>(`/beds/${id}`),
      api.get<{ plantings: Planting[] }>(`/beds/${id}/plantings`),
      api.get<{ species: Species[] }>('/species'),
    ])
      .then(([bedData, plantingsData, speciesData]) => {
        setBed(bedData.bed)
        setPlantings(plantingsData.plantings)
        setSpecies(speciesData.species)
      })
      .finally(() => setIsLoading(false))
  }

  function startMode(next: Mode) {
    setMode(next)
    setDraft(null)
    setRotationWarning(null)
  }

  function handleCanvasClick(x: number, y: number) {
    if (mode === 'point') {
      setDraft({ type: 'point', x, y })
      return
    }

    if (mode === 'row') {
      if (!draft || draft.type !== 'row' || draft.x2 !== undefined) {
        // pierwszy klik (albo zaczynamy nowy odcinek) - ustawiamy początek rzędu
        setDraft({ type: 'row', x, y })
      } else {
        // drugi klik - domykamy odcinek rzędu
        setDraft({ ...draft, x2: x, y2: y })
      }
    }
  }

  function handleCancelDraft() {
    setMode('idle')
    setDraft(null)
  }

  async function handleSubmitPlanting(values: PlantingFormValues) {
    if (!bedId || !draft) return

    const payload =
      draft.type === 'point'
        ? { type: 'point', x_cm: draft.x, y_cm: draft.y, ...values }
        : { type: 'row', x_cm: draft.x, y_cm: draft.y, x2_cm: draft.x2, y2_cm: draft.y2, ...values }

    const result = await api.post<{ planting: Planting; warning: string | null }>(`/beds/${bedId}/plantings`, payload)
    setMode('idle')
    setDraft(null)
    setRotationWarning(result.warning)
    loadData(bedId)
  }

  async function handleDeletePlanting(id: number) {
    if (!bedId) return
    if (!confirm('Usunąć to nasadzenie?')) return
    await api.delete(`/plantings/${id}`)
    loadData(bedId)
  }

  if (isLoading) {
    return <p className="page-status">Wczytywanie…</p>
  }

  if (!bed) {
    return <p className="page-status">Nie znaleziono grządki.</p>
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <Link to={`/gardens/${gardenId}`}>&larr; Ogród</Link>
          <h1>{bed.name}</h1>
          <p>
            {bed.width_cm}×{bed.length_cm} cm
          </p>
        </div>
      </header>

      {rotationWarning && (
        <div className="rotation-warning">
          <span>⚠️ {rotationWarning}</span>
          <button type="button" className="secondary small" onClick={() => setRotationWarning(null)}>
            Zamknij
          </button>
        </div>
      )}

      <div className="planting-toolbar">
        <button type="button" className={mode === 'point' ? '' : 'secondary'} onClick={() => startMode('point')}>
          Dodaj punkt
        </button>
        <button type="button" className={mode === 'row' ? '' : 'secondary'} onClick={() => startMode('row')}>
          Dodaj rząd
        </button>
        {mode !== 'idle' && (
          <button type="button" className="secondary" onClick={handleCancelDraft}>
            Anuluj sadzenie
          </button>
        )}
      </div>

      {mode !== 'idle' && !draft && (
        <p className="page-status">
          {mode === 'point'
            ? 'Kliknij na planie grządki, żeby wskazać miejsce sadzenia.'
            : 'Kliknij na planie grządki, żeby wskazać początek rzędu.'}
        </p>
      )}

      <PlantingCanvas
        bed={bed}
        plantings={plantings}
        draft={draft}
        onCanvasClick={mode !== 'idle' ? handleCanvasClick : undefined}
      />

      {mode !== 'idle' && draft && (
        <PlantingForm draft={draft} species={species} onSubmit={handleSubmitPlanting} onCancel={handleCancelDraft} />
      )}

      <section>
        <h2>Historia grządki</h2>
        {plantings.length === 0 && <p className="page-status">Brak nasadzeń na tej grządce.</p>}
        {groupByYear(plantings).map(([year, group]) => (
          <div key={year} className="history-year-group">
            <h3>{year}</h3>
            <ul className="planting-list">
              {group.map((planting) => (
                <li key={planting.id} className="planting-list-item">
                  <span className="species-color-dot" style={{ background: planting.species_color }} />
                  <span>
                    {planting.species_name}
                    {planting.variety_name ? ` (${planting.variety_name})` : ''}
                    {planting.species_family ? ` — ${planting.species_family}` : ''} —{' '}
                    {planting.type === 'point' ? 'punkt' : 'rząd'}
                  </span>
                  <button type="button" className="danger small" onClick={() => handleDeletePlanting(planting.id)}>
                    Usuń
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  )
}

// Grupuje nasadzenia wg roku wyciągniętego z planted_date (albo "Bez daty"),
// malejąco - to najprostszy sposób pokazania historii grządki bez osobnej
// encji "sezon" w bazie (patrz POSTEP.md - świadome uproszczenie).
function groupByYear(plantings: Planting[]): [string, Planting[]][] {
  const groups = new Map<string, Planting[]>()

  for (const planting of plantings) {
    const year = planting.planted_date ? planting.planted_date.slice(0, 4) : 'Bez daty'
    const existing = groups.get(year) ?? []
    existing.push(planting)
    groups.set(year, existing)
  }

  return Array.from(groups.entries()).sort(([a], [b]) => {
    if (a === 'Bez daty') return 1
    if (b === 'Bez daty') return -1
    return b.localeCompare(a)
  })
}
