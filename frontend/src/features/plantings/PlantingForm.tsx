import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../../api/client'
import type { Species, Variety } from '../species/types'
import type { Planting, PlantingDraft } from './types'

export interface PlantingFormValues {
  species_id: number
  variety_id: number | null
  spacing_cm?: number
  planted_date: string | null
  notes: string | null
}

interface PlantingFormProps {
  draft?: PlantingDraft | null
  initialPlanting?: Planting
  species: Species[]
  onSubmit: (values: PlantingFormValues) => Promise<void>
  onCancel: () => void
}

// Jeden formularz obsługuje zarówno dodawanie nowego nasadzenia (draft z
// PlantingCanvas ma już komplet współrzędnych), jak i edycję istniejącego
// (initialPlanting z historii grządki) - podobnie jak BedForm dla grządek.
// Edycja nie zmienia geometrii (x/y/x2/y2) - przesunięcie wymagałoby
// przeciągania na canvasie, którego nie ma; zmienić można gatunek, odmianę,
// odstęp, datę i notatkę.
export function PlantingForm({ draft, initialPlanting, species, onSubmit, onCancel }: PlantingFormProps) {
  const type = initialPlanting?.type ?? draft?.type
  const [speciesId, setSpeciesId] = useState<number | ''>(initialPlanting?.species_id ?? '')
  const [varieties, setVarieties] = useState<Variety[]>([])
  const [varietyId, setVarietyId] = useState<number | ''>(initialPlanting?.variety_id ?? '')
  const [spacingCm, setSpacingCm] = useState(initialPlanting?.spacing_cm ? String(initialPlanting.spacing_cm) : '30')
  const [plantedDate, setPlantedDate] = useState(initialPlanting?.planted_date ?? todayIsoDate())
  const [notes, setNotes] = useState(initialPlanting?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (speciesId === '') {
      setVarieties([])
      setVarietyId('')
      return
    }
    api.get<{ varieties: Variety[] }>(`/species/${speciesId}/varieties`).then((data) => {
      setVarieties(data.varieties)
      // Przy edycji pierwsze uruchomienie efektu nie powinno zgubić już
      // zapisanej odmiany - zostawiamy ją, jeśli nadal należy do gatunku.
      setVarietyId((current) => (current !== '' && data.varieties.some((v) => v.id === current) ? current : ''))
    })

    // Podpowiadamy odstęp z biblioteki gatunku tylko przy dodawaniu nowego
    // nasadzenia - przy edycji nie chcemy nadpisywać już ustawionej wartości.
    if (!initialPlanting) {
      const selected = species.find((s) => s.id === speciesId)
      if (selected?.spacing_cm) {
        setSpacingCm(String(selected.spacing_cm))
      }
    }
  }, [speciesId, species, initialPlanting])

  const isRowReady =
    Boolean(initialPlanting) ||
    type === 'point' ||
    (draft?.type === 'row' && draft.x2 !== undefined && draft.y2 !== undefined)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (speciesId === '') {
      setError('Wybierz gatunek rośliny')
      return
    }

    if (type === 'row' && Number(spacingCm) <= 0) {
      setError('Podaj dodatni odstęp między roślinami w rzędzie')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        species_id: speciesId,
        variety_id: varietyId === '' ? null : varietyId,
        spacing_cm: type === 'row' ? Number(spacingCm) : undefined,
        planted_date: plantedDate || null,
        notes: notes.trim() || null,
      })
    } catch {
      setError(initialPlanting ? 'Nie udało się zapisać zmian' : 'Nie udało się zapisać nasadzenia')
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

      {type === 'row' && (
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
          {isSubmitting ? 'Zapisywanie…' : initialPlanting ? 'Zapisz zmiany' : 'Zapisz nasadzenie'}
        </button>
        <button type="button" className="secondary" onClick={onCancel}>
          Anuluj
        </button>
      </div>
    </form>
  )
}

// Data lokalna (nie UTC) w formacie oczekiwanym przez <input type="date"> -
// najczęściej sadzi się "dziś", więc to sensowna wartość startowa formularza.
function todayIsoDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
