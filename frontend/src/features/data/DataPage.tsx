import { useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../../api/client'

interface ImportSummary {
  species: number
  varieties: number
  gardens: number
  beds: number
  plantings: number
}

// Eksport/import to zwykły plik JSON - backend (ExportController/ImportController)
// zwraca/przyjmuje ten sam kształt danych, więc frontend tylko go przenosi
// między dyskiem użytkownika a odpowiedzią/żądaniem HTTP, bez interpretacji.
export function DataPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<ImportSummary | null>(null)

  async function handleExport() {
    setIsExporting(true)
    setError(null)
    try {
      const data = await api.get<unknown>('/export')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `moj-ogrod-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Nie udało się pobrać eksportu')
    } finally {
      setIsExporting(false)
    }
  }

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (
      !confirm(
        'Import dokłada dane z pliku do Twojego konta (nie nadpisuje ani nie scala z istniejącymi). Kontynuować?',
      )
    ) {
      return
    }

    setIsImporting(true)
    setError(null)
    setSummary(null)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const result = await api.post<{ imported: ImportSummary }>('/import', parsed)
      setSummary(result.imported)
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Wybrany plik nie jest poprawnym plikiem JSON')
      } else if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Nie udało się zaimportować pliku')
      }
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <Link to="/gardens">&larr; Moje ogrody</Link>
          <h1>Eksport i import danych</h1>
        </div>
      </header>

      <section className="data-section">
        <h2>Eksport</h2>
        <p className="page-status">
          Pobierz wszystkie swoje dane (ogrody, grządki, nasadzenia oraz własne gatunki i odmiany) jako plik JSON -
          przydatne jako kopia zapasowa.
        </p>
        <button type="button" onClick={handleExport} disabled={isExporting}>
          {isExporting ? 'Pobieranie…' : 'Pobierz plik JSON'}
        </button>
      </section>

      <section className="data-section">
        <h2>Import</h2>
        <p className="page-status">
          Wczytaj wcześniej wyeksportowany plik JSON. Dane zostaną dodane do Twojego konta - żadne istniejące dane nie
          zostaną nadpisane ani usunięte.
        </p>
        <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleFileSelected} disabled={isImporting} />
        {isImporting && <p className="page-status">Importowanie…</p>}
        {error && <p className="form-error">{error}</p>}
        {summary && (
          <p className="page-status">
            Zaimportowano: {summary.gardens} ogrodów, {summary.beds} grządek, {summary.plantings} nasadzeń,{' '}
            {summary.species} gatunków, {summary.varieties} odmian.
          </p>
        )}
      </section>
    </div>
  )
}
