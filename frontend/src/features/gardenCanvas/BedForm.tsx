import { useState, type FormEvent } from 'react'
import type { Bed } from '../gardens/types'

export interface BedFormValues {
  name: string
  width_cm: number
  length_cm: number
  pos_x_cm: number
  pos_y_cm: number
}

interface BedFormProps {
  initialBed?: Bed
  onSubmit: (values: BedFormValues) => Promise<void>
  onCancel?: () => void
}

// Jeden formularz obsługuje zarówno dodawanie nowej grządki, jak i edycję
// istniejącej (initialBed) - różni się tylko wartościami startowymi i
// etykietą przycisku, więc nie ma sensu duplikować dwóch formularzy.
export function BedForm({ initialBed, onSubmit, onCancel }: BedFormProps) {
  const [name, setName] = useState(initialBed?.name ?? '')
  const [widthCm, setWidthCm] = useState(String(initialBed?.width_cm ?? '100'))
  const [lengthCm, setLengthCm] = useState(String(initialBed?.length_cm ?? '100'))
  const [posXCm, setPosXCm] = useState(String(initialBed?.pos_x_cm ?? '0'))
  const [posYCm, setPosYCm] = useState(String(initialBed?.pos_y_cm ?? '0'))
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const width = Number(widthCm)
    const length = Number(lengthCm)

    if (!name.trim() || width <= 0 || length <= 0) {
      setError('Podaj nazwę oraz dodatnie wymiary grządki')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        width_cm: width,
        length_cm: length,
        pos_x_cm: Number(posXCm) || 0,
        pos_y_cm: Number(posYCm) || 0,
      })
      if (!initialBed) {
        setName('')
        setWidthCm('100')
        setLengthCm('100')
        setPosXCm('0')
        setPosYCm('0')
      }
    } catch {
      setError('Nie udało się zapisać grządki')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bed-form">
      <label>
        Nazwa
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <div className="bed-form-grid">
        <label>
          Szerokość (cm)
          <input type="number" min="1" value={widthCm} onChange={(e) => setWidthCm(e.target.value)} required />
        </label>
        <label>
          Długość (cm)
          <input type="number" min="1" value={lengthCm} onChange={(e) => setLengthCm(e.target.value)} required />
        </label>
        <label>
          Pozycja X (cm)
          <input type="number" value={posXCm} onChange={(e) => setPosXCm(e.target.value)} />
        </label>
        <label>
          Pozycja Y (cm)
          <input type="number" value={posYCm} onChange={(e) => setPosYCm(e.target.value)} />
        </label>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="bed-form-actions">
        <button type="submit" disabled={isSubmitting}>
          {initialBed ? 'Zapisz zmiany' : 'Dodaj grządkę'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="secondary">
            Anuluj
          </button>
        )}
      </div>
    </form>
  )
}
