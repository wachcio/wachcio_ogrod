import { useRef, type MouseEvent } from 'react'
import { GridLines } from '../../components/GridLines'
import type { Bed } from '../gardens/types'
import type { Planting, PlantingDraft } from './types'

const PADDING_CM = 15
const GRID_STEP_CM = 25

interface PlantingCanvasProps {
  bed: Bed
  plantings: Planting[]
  draft?: PlantingDraft | null
  onCanvasClick?: (x: number, y: number) => void
}

// Podobnie jak GardenCanvas - viewBox w centymetrach daje nam skalę "za darmo".
// Klik na canvasie przeliczamy z pikseli ekranu na jednostki viewBox (czyli
// cm) przez odwrotność macierzy transformacji SVG (getScreenCTM().inverse()) -
// to standardowy sposób na "hit testing" we współrzędnych SVG w przeglądarce.
export function PlantingCanvas({ bed, plantings, draft, onCanvasClick }: PlantingCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const width = Number(bed.width_cm)
  const length = Number(bed.length_cm)
  const viewWidth = width + PADDING_CM * 2
  const viewHeight = length + PADDING_CM * 2

  function handleClick(event: MouseEvent<SVGSVGElement>) {
    if (!onCanvasClick || !svgRef.current) return

    const svg = svgRef.current
    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY

    const ctm = svg.getScreenCTM()
    if (!ctm) return

    const transformed = point.matrixTransform(ctm.inverse())
    const x = clamp(transformed.x - PADDING_CM, 0, width)
    const y = clamp(transformed.y - PADDING_CM, 0, length)
    onCanvasClick(round1(x), round1(y))
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      className={onCanvasClick ? 'planting-canvas clickable' : 'planting-canvas'}
      onClick={handleClick}
      role="img"
      aria-label={`Plan grządki ${bed.name}`}
    >
      <g transform={`translate(${PADDING_CM}, ${PADDING_CM})`}>
        <GridLines width={width} height={length} step={GRID_STEP_CM} />
        <rect x={0} y={0} width={width} height={length} className="bed-outline" />
        {plantings.map((planting) => (
          <PlantingShape key={planting.id} planting={planting} />
        ))}
        {draft && <DraftShape draft={draft} />}
      </g>
    </svg>
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

// Rząd w bazie to jeden odcinek (x,y)-(x2,y2) + odstęp spacing_cm - punkty
// wzdłuż niego dogenerowujemy tutaj, żeby nie trzymać w bazie osobnego
// wiersza na każdą roślinę w rzędzie.
function computeRowPoints(x: number, y: number, x2: number, y2: number, spacing: number) {
  const dx = x2 - x
  const dy = y2 - y
  const length = Math.hypot(dx, dy)

  if (length === 0 || spacing <= 0) {
    return [{ x, y }]
  }

  const count = Math.max(1, Math.floor(length / spacing) + 1)
  const points = []
  for (let i = 0; i < count; i++) {
    const t = Math.min((i * spacing) / length, 1)
    points.push({ x: x + dx * t, y: y + dy * t })
  }
  return points
}

function PlantingShape({ planting }: { planting: Planting }) {
  const x = Number(planting.x_cm)
  const y = Number(planting.y_cm)
  const title = planting.variety_name ? `${planting.species_name} (${planting.variety_name})` : planting.species_name

  if (planting.type === 'point') {
    return (
      <circle cx={x} cy={y} r={2.5} className="planting-dot" style={{ fill: planting.species_color }}>
        <title>{title}</title>
      </circle>
    )
  }

  const x2 = Number(planting.x2_cm)
  const y2 = Number(planting.y2_cm)
  const spacing = Number(planting.spacing_cm)
  const points = computeRowPoints(x, y, x2, y2, spacing)

  return (
    <g>
      <line x1={x} y1={y} x2={x2} y2={y2} className="row-guide" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2} className="planting-dot" style={{ fill: planting.species_color }}>
          <title>{title}</title>
        </circle>
      ))}
    </g>
  )
}

function DraftShape({ draft }: { draft: PlantingDraft }) {
  if (draft.type === 'point' || draft.x2 === undefined || draft.y2 === undefined) {
    return <circle cx={draft.x} cy={draft.y} r={3} className="planting-draft" />
  }

  return (
    <g>
      <line x1={draft.x} y1={draft.y} x2={draft.x2} y2={draft.y2} className="row-guide draft" />
      <circle cx={draft.x} cy={draft.y} r={3} className="planting-draft" />
      <circle cx={draft.x2} cy={draft.y2} r={3} className="planting-draft" />
    </g>
  )
}
