export interface Garden {
  id: number
  name: string
  description: string
  created_at?: string
}

// Kolumny DECIMAL z MySQL wracają przez PDO jako stringi (np. "150.0"),
// więc pola wymiarów/pozycji akceptują też string - liczymy je przez
// Number(...) tam, gdzie robimy na nich matematykę (patrz GardenCanvas).
export interface Bed {
  id: number
  garden_id: number
  name: string
  width_cm: number | string
  length_cm: number | string
  pos_x_cm: number | string
  pos_y_cm: number | string
  rotation_deg: number | string
}
