import { useState, type FormEvent } from 'react'
import { SUN_REQUIREMENT_LABELS, type Species, type SunRequirement } from './types'

export interface SpeciesFormValues {
  name: string
  color: string
  latin_name: string | null
  family: string | null
  spacing_cm: number | null
  row_spacing_cm: number | null
  depth_cm: number | null
  sun_requirement: SunRequirement | null
  sow_start_month: number | null
  sow_end_month: number | null
  harvest_start_month: number | null
  harvest_end_month: number | null
}

const DEFAULT_COLOR = '#4caf50'

interface SpeciesFormProps {
  initialSpecies?: Species
  onSubmit: (values: SpeciesFormValues) => Promise<void>
  onCancel: () => void
}

// Jeden formularz obsługuje zarówno dodawanie nowego gatunku, jak i edycję
// istniejącego (initialSpecies) - analogicznie do BedForm/PlantingForm.
export function SpeciesForm({ initialSpecies, onSubmit, onCancel }: SpeciesFormProps) {
  const [name, setName] = useState(initialSpecies?.name ?? '')
  const [color, setColor] = useState(initialSpecies?.color ?? DEFAULT_COLOR)
  const [latinName, setLatinName] = useState(initialSpecies?.latin_name ?? '')
  const [family, setFamily] = useState(initialSpecies?.family ?? '')
  const [spacingCm, setSpacingCm] = useState(initialSpecies?.spacing_cm ? String(initialSpecies.spacing_cm) : '')
  const [rowSpacingCm, setRowSpacingCm] = useState(
    initialSpecies?.row_spacing_cm ? String(initialSpecies.row_spacing_cm) : '',
  )
  const [depthCm, setDepthCm] = useState(initialSpecies?.depth_cm ? String(initialSpecies.depth_cm) : '')
  const [sunRequirement, setSunRequirement] = useState<SunRequirement | ''>(initialSpecies?.sun_requirement ?? '')
  const [sowStartMonth, setSowStartMonth] = useState(
    initialSpecies?.sow_start_month ? String(initialSpecies.sow_start_month) : '',
  )
  const [sowEndMonth, setSowEndMonth] = useState(
    initialSpecies?.sow_end_month ? String(initialSpecies.sow_end_month) : '',
  )
  const [harvestStartMonth, setHarvestStartMonth] = useState(
    initialSpecies?.harvest_start_month ? String(initialSpecies.harvest_start_month) : '',
  )
  const [harvestEndMonth, setHarvestEndMonth] = useState(
    initialSpecies?.harvest_end_month ? String(initialSpecies.harvest_end_month) : '',
  )
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Nazwa gatunku jest wymagana')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        color,
        latin_name: latinName.trim() || null,
        family: family.trim() || null,
        spacing_cm: spacingCm ? Number(spacingCm) : null,
        row_spacing_cm: rowSpacingCm ? Number(rowSpacingCm) : null,
        depth_cm: depthCm ? Number(depthCm) : null,
        sun_requirement: sunRequirement || null,
        sow_start_month: sowStartMonth ? Number(sowStartMonth) : null,
        sow_end_month: sowEndMonth ? Number(sowEndMonth) : null,
        harvest_start_month: harvestStartMonth ? Number(harvestStartMonth) : null,
        harvest_end_month: harvestEndMonth ? Number(harvestEndMonth) : null,
      })
    } catch {
      setError(initialSpecies ? 'Nie udało się zapisać zmian' : 'Nie udało się dodać gatunku')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bed-form">
      <label>
        Nazwa gatunku
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <div className="bed-form-grid">
        <label>
          Nazwa łacińska (opcjonalnie)
          <input type="text" value={latinName} onChange={(e) => setLatinName(e.target.value)} />
        </label>
        <label>
          Rodzina (opcjonalnie)
          <input type="text" value={family} onChange={(e) => setFamily(e.target.value)} />
        </label>
        <label>
          Odstęp w rzędzie (cm)
          <input type="number" min="1" value={spacingCm} onChange={(e) => setSpacingCm(e.target.value)} />
        </label>
        <label>
          Odstęp między rzędami (cm)
          <input type="number" min="1" value={rowSpacingCm} onChange={(e) => setRowSpacingCm(e.target.value)} />
        </label>
        <label>
          Głębokość siewu (cm)
          <input type="number" min="0" step="0.5" value={depthCm} onChange={(e) => setDepthCm(e.target.value)} />
        </label>
        <label>
          Stanowisko
          <select value={sunRequirement} onChange={(e) => setSunRequirement(e.target.value as SunRequirement | '')}>
            <option value="">Nie określono</option>
            {Object.entries(SUN_REQUIREMENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Siew od (miesiąc)
          <input type="number" min="1" max="12" value={sowStartMonth} onChange={(e) => setSowStartMonth(e.target.value)} />
        </label>
        <label>
          Siew do (miesiąc)
          <input type="number" min="1" max="12" value={sowEndMonth} onChange={(e) => setSowEndMonth(e.target.value)} />
        </label>
        <label>
          Zbiór od (miesiąc)
          <input
            type="number"
            min="1"
            max="12"
            value={harvestStartMonth}
            onChange={(e) => setHarvestStartMonth(e.target.value)}
          />
        </label>
        <label>
          Zbiór do (miesiąc)
          <input
            type="number"
            min="1"
            max="12"
            value={harvestEndMonth}
            onChange={(e) => setHarvestEndMonth(e.target.value)}
          />
        </label>
        <label>
          Kolor na planie
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </label>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="bed-form-actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Zapisywanie…' : initialSpecies ? 'Zapisz zmiany' : 'Dodaj gatunek'}
        </button>
        <button type="button" className="secondary" onClick={onCancel}>
          Anuluj
        </button>
      </div>
    </form>
  )
}
