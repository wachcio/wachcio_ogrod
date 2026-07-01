export type SunRequirement = 'sun' | 'partial_shade' | 'shade'

export const SUN_REQUIREMENT_LABELS: Record<SunRequirement, string> = {
  sun: 'Pełne słońce',
  partial_shade: 'Półcień',
  shade: 'Cień',
}

// owner_id === null oznacza gatunek/odmianę systemową (współdzieloną,
// tylko do odczytu) - patrz komentarz w SpeciesController.php.
export interface Species {
  id: number
  owner_id: number | null
  name: string
  latin_name: string | null
  family: string | null
  spacing_cm: number | string | null
  row_spacing_cm: number | string | null
  depth_cm: number | string | null
  sun_requirement: SunRequirement | null
  sow_start_month: number | null
  sow_end_month: number | null
  harvest_start_month: number | null
  harvest_end_month: number | null
  color: string
}

export interface Variety {
  id: number
  species_id: number
  owner_id: number | null
  name: string
  days_to_harvest_min: number | null
  days_to_harvest_max: number | null
  seed_source: string | null
  description: string | null
}
