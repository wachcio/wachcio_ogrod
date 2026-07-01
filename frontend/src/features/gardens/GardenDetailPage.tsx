import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import { BedForm, type BedFormValues } from '../gardenCanvas/BedForm'
import { GardenCanvas } from '../gardenCanvas/GardenCanvas'
import type { Bed, Garden } from './types'

export function GardenDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [garden, setGarden] = useState<Garden | null>(null)
  const [beds, setBeds] = useState<Bed[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingBedId, setEditingBedId] = useState<number | null>(null)

  useEffect(() => {
    if (!id) return
    loadData(id)
  }, [id])

  function loadData(gardenId: string) {
    setIsLoading(true)
    Promise.all([
      api.get<{ garden: Garden }>(`/gardens/${gardenId}`),
      api.get<{ beds: Bed[] }>(`/gardens/${gardenId}/beds`),
    ])
      .then(([gardenData, bedsData]) => {
        setGarden(gardenData.garden)
        setBeds(bedsData.beds)
      })
      .finally(() => setIsLoading(false))
  }

  async function handleAddBed(values: BedFormValues) {
    if (!id) return
    await api.post(`/gardens/${id}/beds`, values)
    loadData(id)
  }

  async function handleUpdateBed(bedId: number, values: BedFormValues) {
    if (!id) return
    await api.put(`/beds/${bedId}`, values)
    setEditingBedId(null)
    loadData(id)
  }

  async function handleDeleteBed(bedId: number) {
    if (!id) return
    if (!confirm('Usunąć tę grządkę?')) return
    await api.delete(`/beds/${bedId}`)
    loadData(id)
  }

  if (isLoading) {
    return <p className="page-status">Wczytywanie…</p>
  }

  if (!garden) {
    return <p className="page-status">Nie znaleziono ogrodu.</p>
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <Link to="/gardens">&larr; Moje ogrody</Link>
          <h1>{garden.name}</h1>
          {garden.description && <p>{garden.description}</p>}
        </div>
      </header>

      <GardenCanvas beds={beds} />

      <section>
        <h2>Grządki</h2>
        <ul className="bed-list">
          {beds.map((bed) =>
            editingBedId === bed.id ? (
              <li key={bed.id}>
                <BedForm
                  initialBed={bed}
                  onSubmit={(values) => handleUpdateBed(bed.id, values)}
                  onCancel={() => setEditingBedId(null)}
                />
              </li>
            ) : (
              <li key={bed.id} className="bed-list-item">
                <span>
                  {bed.name} — {bed.width_cm}×{bed.length_cm} cm
                </span>
                <span className="bed-list-actions">
                  <button type="button" className="secondary" onClick={() => setEditingBedId(bed.id)}>
                    Edytuj
                  </button>
                  <button type="button" className="danger" onClick={() => handleDeleteBed(bed.id)}>
                    Usuń
                  </button>
                </span>
              </li>
            ),
          )}
        </ul>
      </section>

      <section>
        <h2>Dodaj grządkę</h2>
        <BedForm onSubmit={handleAddBed} />
      </section>
    </div>
  )
}
