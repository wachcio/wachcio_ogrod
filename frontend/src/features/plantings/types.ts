export type PlantingType = 'point' | 'row'

export interface Planting {
  id: number
  bed_id: number
  species_id: number
  variety_id: number | null
  type: PlantingType
  x_cm: number | string
  y_cm: number | string
  x2_cm: number | string | null
  y2_cm: number | string | null
  spacing_cm: number | string | null
  planted_date: string | null
  notes: string | null
  species_name: string
  species_color: string
  species_family: string | null
  variety_name: string | null
}

// Sadzenie "w budowie" - podgląd na canvasie zanim użytkownik zatwierdzi
// formularz (patrz PlantingCanvas + BedDetailPage).
export type PlantingDraft =
  | { type: 'point'; x: number; y: number }
  | { type: 'row'; x: number; y: number; x2?: number; y2?: number }
