import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../../api/client'
import type { Species, Variety } from '../species/types'
import type { PlantingDraft } from './types'

export interface PlantingFormValues {
  species_id: number
  variety_id: number | null
  spacing_cm?: number
  planted_date: string | null
  notes: string | null
}

interface PlantingFormProps {
  draft: PlantingDraft
  species: Species[]
  onSubmit: (values: PlantingFormValues) => Promise<void>
  onCancel: () => void
}

// Formularz pojawia się dopiero gdy draft ma już komplet współrzędnych
// (punkt albo cały odcinek rzędu) - użytkownik wybiera tu tylko *co* rośnie
// w miejscu, które przed chwilą wskazał kliknięciem na PlantingCanvas.
export function PlantingForm({ draft, species, onSubmit, onCancel }: PlantingFormProps) {
  const [speciesId, setSpeciesId] = useState<number | ''>('')
  const [varieties, setVarieties] = useState<Variety[]>([])
  const [varietyId, setVarietyId] = useState<number | ''>('')
  const [spacingCm, setSpacingCm] = useState('30')
  const [plantedDate, setPlantedDate] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (speciesId === '') {
      setVarieties([])
      setVarietyId('')
      return
    }
    api.get<{ varieties: Variety[] }>(`/species/${speciesId}/varieties`).then((data) => setVarieties(data.varieties))
    setVarietyId('')
  }, [speciesId])

  const isRowReady = draft.type === 'point' || (draft.x2 !== undefined && draft.y2 !== undefined)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (speciesId === '') {
      setError('Wybierz gatunek rośliny')
      return
    }

    if (draft.type === 'row' && Number(spacingCm) <= 0) {
      setError('Podaj dodatni odstęp między roślinami w rzędzie')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        species_id: speciesId,
        variety_id: varietyId === '' ? null : varietyId,
        spacing_cm: draft.type === 'row' ? Number(spacingCm) : undefined,
        planted_date: plantedDate || null,
        notes: notes.trim() || null,
      })
    } catch {
      setError('Nie udało się zapisać nasadzenia')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isRowReady) {
    return <p className="page-status">Kliknij na planie grządki, żeby wskazać koniec rzędu.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="bed-form">
      <label>
        Gatunek
        <select value={speciesId} onChange={(e) => setSpeciesId(e.target.value ? Number(e.target.value) : '')} required>
          <option value="">Wybierz gatunek…</option>
          {species.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      {varieties.length > 0 && (
        <label>
          Odmiana (opcjonalnie)
          <select value={varietyId} onChange={(e) => setVarietyId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">Bez konkretnej odmiany</option>
            {varieties.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {draft.type === 'row' && (
        <label>
          Odstęp między roślinami w rzędzie (cm)
          <input type="number" min="1" value={spacingCm} onChange={(e) => setSpacingCm(e.target.value)} required />
        </label>
      )}

      <label>
        Data posadzenia (opcjonalnie)
        <input type="date" value={plantedDate} onChange={(e) => setPlantedDate(e.target.value)} />
      </label>

      <label>
        Notatka (opcjonalnie)
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      {error && <p className="form-error">{error}</p>}

      <div className="bed-form-actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Zapisywanie…' : 'Zapisz nasadzenie'}
        </button>
        <button type="button" className="secondary" onClick={onCancel}>
          Anuluj
        </button>
      </div>
    </form>
  )
}
