import { GridLines } from '../../components/GridLines'
import type { Bed } from '../gardens/types'

const PADDING_CM = 30
const GRID_STEP_CM = 50

interface GardenCanvasProps {
  beds: Bed[]
  onBedClick?: (bed: Bed) => void
}

// Grządki rysujemy w skali rzeczywistej: viewBox SVG ustawiamy wprost w
// centymetrach (0 0 width height), więc <rect x={pos_x_cm} width={width_cm}>
// automatycznie zachowuje właściwe proporcje - SVG samo przeskalowuje te
// "jednostki użytkownika" do rzeczywistych pikseli w przeglądarce. Dzięki
// temu nie musimy ręcznie liczyć mnożnika cm->px.
export function GardenCanvas({ beds, onBedClick }: GardenCanvasProps) {
  if (beds.length === 0) {
    return <p className="canvas-empty">Dodaj pierwszą grządkę, żeby zobaczyć plan ogrodu.</p>
  }

  const maxX = Math.max(...beds.map((b) => Number(b.pos_x_cm) + Number(b.width_cm)))
  const maxY = Math.max(...beds.map((b) => Number(b.pos_y_cm) + Number(b.length_cm)))
  const width = maxX + PADDING_CM
  const height = maxY + PADDING_CM

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="garden-canvas" role="img" aria-label="Plan ogrodu">
      <GridLines width={width} height={height} step={GRID_STEP_CM} />
      {beds.map((bed) => {
        const x = Number(bed.pos_x_cm)
        const y = Number(bed.pos_y_cm)
        const w = Number(bed.width_cm)
        const h = Number(bed.length_cm)
        const rotation = Number(bed.rotation_deg) || 0
        const cx = x + w / 2
        const cy = y + h / 2

        return (
          <g
            key={bed.id}
            transform={rotation ? `rotate(${rotation} ${cx} ${cy})` : undefined}
            onClick={onBedClick ? () => onBedClick(bed) : undefined}
            className={onBedClick ? 'bed-group clickable' : 'bed-group'}
          >
            <rect x={x} y={y} width={w} height={h} rx={2} className="bed-rect" />
            <text x={cx} y={cy - 2} textAnchor="middle" className="bed-label">
              {bed.name}
            </text>
            <text x={cx} y={cy + 8} textAnchor="middle" className="bed-dimensions">
              {w}×{h} cm
            </text>
          </g>
        )
      })}
    </svg>
  )
}
