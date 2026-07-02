import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { SpeciesCard } from './SpeciesCard'
import { SUN_REQUIREMENT_LABELS, type Species, type SunRequirement } from './types'

const DEFAULT_COLOR = '#4caf50'

export function SpeciesLibraryPage() {
  const [species, setSpecies] = useState<Species[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)
  // Te pola są opcjonalne, ale świadomie zbieramy ten sam komplet co gatunki
  // systemowe z migracji seed - inaczej własne gatunki użytkownika zostają
  // "ubogie" (samo name+color) i tracą przydatność w bibliotece i na planie.
  const [latinName, setLatinName] = useState('')
  const [family, setFamily] = useState('')
  const [spacingCm, setSpacingCm] = useState('')
  const [rowSpacingCm, setRowSpacingCm] = useState('')
  const [depthCm, setDepthCm] = useState('')
  const [sunRequirement, setSunRequirement] = useState<SunRequirement | ''>('')
  const [sowStartMonth, setSowStartMonth] = useState('')
  const [sowEndMonth, setSowEndMonth] = useState('')
  const [harvestStartMonth, setHarvestStartMonth] = useState('')
  const [harvestEndMonth, setHarvestEndMonth] = useState('')

  useEffect(() => {
    loadSpecies()
  }, [])

  function loadSpecies() {
    setIsLoading(true)
    api
      .get<{ species: Species[] }>('/species')
      .then((data) => setSpecies(data.species))
      .finally(() => setIsLoading(false))
  }

  async function handleAddSpecies(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return

    await api.post('/species', {
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
    setName('')
    setColor(DEFAULT_COLOR)
    setLatinName('')
    setFamily('')
    setSpacingCm('')
    setRowSpacingCm('')
    setDepthCm('')
    setSunRequirement('')
    setSowStartMonth('')
    setSowEndMonth('')
    setHarvestStartMonth('')
    setHarvestEndMonth('')
    setIsAdding(false)
    loadSpecies()
  }

  const filtered = species.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <Link to="/gardens">&larr; Moje ogrody</Link>
          <h1>Biblioteka roślin</h1>
        </div>
      </header>

      <input
        type="text"
        placeholder="Szukaj gatunku…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="species-search"
      />

      {isLoading && <p className="page-status">Wczytywanie…</p>}

      <ul className="species-list">
        {filtered.map((s) => (
          <SpeciesCard key={s.id} species={s} onDeleted={loadSpecies} />
        ))}
      </ul>

      {isAdding ? (
        <form onSubmit={handleAddSpecies} className="bed-form">
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
              <input
                type="number"
                min="1"
                max="12"
                value={sowStartMonth}
                onChange={(e) => setSowStartMonth(e.target.value)}
              />
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
          <div className="bed-form-actions">
            <button type="submit">Dodaj gatunek</button>
            <button type="button" className="secondary" onClick={() => setIsAdding(false)}>
              Anuluj
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setIsAdding(true)}>
          + Dodaj własny gatunek
        </button>
      )}
    </div>
  )
}
