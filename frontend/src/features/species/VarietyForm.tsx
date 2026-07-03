import { useState, type FormEvent } from 'react'
import type { Variety } from './types'

export interface VarietyFormValues {
  name: string
  days_to_harvest_min: number | null
  days_to_harvest_max: number | null
  seed_source: string | null
  description: string | null
}

interface VarietyFormProps {
  initialVariety?: Variety
  onSubmit: (values: VarietyFormValues) => Promise<void>
  onCancel: () => void
}

// Jak SpeciesForm - jeden formularz obsługuje dodawanie nowej odmiany i
// edycję istniejącej (initialVariety).
export function VarietyForm({ initialVariety, onSubmit, onCancel }: VarietyFormProps) {
  const [name, setName] = useState(initialVariety?.name ?? '')
  const [daysToHarvestMin, setDaysToHarvestMin] = useState(
    initialVariety?.days_to_harvest_min ? String(initialVariety.days_to_harvest_min) : '',
  )
  const [daysToHarvestMax, setDaysToHarvestMax] = useState(
    initialVariety?.days_to_harvest_max ? String(initialVariety.days_to_harvest_max) : '',
  )
  const [seedSource, setSeedSource] = useState(initialVariety?.seed_source ?? '')
  const [description, setDescription] = useState(initialVariety?.description ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Nazwa odmiany jest wymagana')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        days_to_harvest_min: daysToHarvestMin ? Number(daysToHarvestMin) : null,
        days_to_harvest_max: daysToHarvestMax ? Number(daysToHarvestMax) : null,
        seed_source: seedSource.trim() || null,
        description: description.trim() || null,
      })
    } catch {
      setError(initialVariety ? 'Nie udało się zapisać zmian' : 'Nie udało się dodać odmiany')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bed-form">
      <label>
        Nazwa odmiany
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <div className="bed-form-grid">
        <label>
          Zbiór po (dni, min)
          <input type="number" min="0" value={daysToHarvestMin} onChange={(e) => setDaysToHarvestMin(e.target.value)} />
        </label>
        <label>
          Zbiór po (dni, max)
          <input type="number" min="0" value={daysToHarvestMax} onChange={(e) => setDaysToHarvestMax(e.target.value)} />
        </label>
        <label>
          Źródło nasion (opcjonalnie)
          <input type="text" value={seedSource} onChange={(e) => setSeedSource(e.target.value)} />
        </label>
      </div>
      <label>
        Opis (opcjonalnie)
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      {error && <p className="form-error">{error}</p>}
      <div className="bed-form-actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Zapisywanie…' : initialVariety ? 'Zapisz zmiany' : 'Dodaj'}
        </button>
        <button type="button" className="secondary" onClick={onCancel}>
          Anuluj
        </button>
      </div>
    </form>
  )
}
