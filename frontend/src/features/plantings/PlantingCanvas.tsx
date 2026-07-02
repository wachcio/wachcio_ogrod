import { useRef, useState, type MouseEvent } from 'react'
import { GridLines } from '../../components/GridLines'
import { RulerAxes } from '../../components/RulerAxes'
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

interface HoverInfo {
  planting: Planting
  x: number
  y: number
}

// Podobnie jak GardenCanvas - viewBox w centymetrach daje nam skalę "za darmo".
// Klik/ruch myszy na canvasie przeliczamy z pikseli ekranu na jednostki
// viewBox (czyli cm) przez odwrotność macierzy transformacji SVG
// (getScreenCTM().inverse()) - to standardowy sposób na "hit testing" we
// współrzędnych SVG w przeglądarce.
export function PlantingCanvas({ bed, plantings, draft, onCanvasClick }: PlantingCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  const [hover, setHover] = useState<HoverInfo | null>(null)
  const width = Number(bed.width_cm)
  const length = Number(bed.length_cm)
  const viewWidth = width + PADDING_CM * 2
  const viewHeight = length + PADDING_CM * 2

  function handleClick(event: MouseEvent<SVGSVGElement>) {
    if (!onCanvasClick || !svgRef.current) return
    const local = toLocalPoint(svgRef.current, event.clientX, event.clientY, width, length)
    if (local) onCanvasClick(local.x, local.y)
  }

  // Pozycja kursora pokazujemy tylko w trybie sadzenia (gdy podano
  // onCanvasClick) - w trybie samego przeglądania grządki byłaby zbędna.
  function handleMouseMove(event: MouseEvent<SVGSVGElement>) {
    if (!onCanvasClick || !svgRef.current) return
    setCursor(toLocalPoint(svgRef.current, event.clientX, event.clientY, width, length))
  }

  function handleMouseLeave() {
    setCursor(null)
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      className={onCanvasClick ? 'planting-canvas clickable' : 'planting-canvas'}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      role="img"
      aria-label={`Plan grządki ${bed.name}`}
    >
      <g transform={`translate(${PADDING_CM}, ${PADDING_CM})`}>
        <GridLines width={width} height={length} step={GRID_STEP_CM} />
        <RulerAxes width={width} height={length} step={GRID_STEP_CM} />
        <rect x={0} y={0} width={width} height={length} className="bed-outline" />
        {plantings.map((planting) => (
          <PlantingShape
            key={planting.id}
            planting={planting}
            onHover={(x, y) => setHover({ planting, x, y })}
            onHoverEnd={() => setHover(null)}
          />
        ))}
        {draft && <DraftShape draft={draft} />}
        {cursor && !hover && <CursorPosition x={cursor.x} y={cursor.y} width={width} height={length} />}
        {hover && <PlantingTooltip hover={hover} width={width} height={length} />}
      </g>
    </svg>
  )
}

function toLocalPoint(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
  width: number,
  height: number,
): { x: number; y: number } | null {
  const point = svg.createSVGPoint()
  point.x = clientX
  point.y = clientY

  const ctm = svg.getScreenCTM()
  if (!ctm) return null

  const transformed = point.matrixTransform(ctm.inverse())
  const x = clamp(transformed.x - PADDING_CM, 0, width)
  const y = clamp(transformed.y - PADDING_CM, 0, height)
  return { x: round1(x), y: round1(y) }
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

function PlantingShape({
  planting,
  onHover,
  onHoverEnd,
}: {
  planting: Planting
  onHover: (x: number, y: number) => void
  onHoverEnd: () => void
}) {
  const x = Number(planting.x_cm)
  const y = Number(planting.y_cm)

  if (planting.type === 'point') {
    return (
      <circle
        cx={x}
        cy={y}
        r={2.5}
        className="planting-dot"
        style={{ fill: planting.species_color }}
        onMouseEnter={() => onHover(x, y)}
        onMouseLeave={onHoverEnd}
      />
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
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={2}
          className="planting-dot"
          style={{ fill: planting.species_color }}
          onMouseEnter={() => onHover(p.x, p.y)}
          onMouseLeave={onHoverEnd}
        />
      ))}
    </g>
  )
}

// Krzyżyk + współrzędne podążające za kursorem podczas sadzenia - ułatwia
// trafienie w konkretne miejsce na grządce razem z linijką (RulerAxes).
function CursorPosition({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
  const nearRight = x > width * 0.6
  const nearBottom = y > height * 0.85
  const labelX = nearRight ? x - 3 : x + 3
  const labelY = nearBottom ? y - 3 : y + 6

  return (
    <g className="cursor-position" pointerEvents="none">
      <line x1={x} y1={0} x2={x} y2={height} className="cursor-guide" />
      <line x1={0} y1={y} x2={width} y2={y} className="cursor-guide" />
      <circle cx={x} cy={y} r={1.2} className="cursor-dot" />
      <text x={labelX} y={labelY} textAnchor={nearRight ? 'end' : 'start'} className="cursor-label">
        {round1(x)} × {round1(y)} cm
      </text>
    </g>
  )
}

// Dymek ze szczegółami rośliny po najechaniu na kropkę - pozycjonowany tak,
// żeby nie wychodzić poza obrys grządki (odwraca się blisko prawej/dolnej krawędzi).
function PlantingTooltip({ hover, width, height }: { hover: HoverInfo; width: number; height: number }) {
  const { planting, x, y } = hover
  const lines: string[] = []
  lines.push(planting.variety_name ? `${planting.species_name} (${planting.variety_name})` : planting.species_name)
  if (planting.species_family) lines.push(`Rodzina: ${planting.species_family}`)
  if (planting.type === 'row' && planting.spacing_cm) lines.push(`Odstęp: ${planting.spacing_cm} cm`)
  if (planting.planted_date) lines.push(`Posadzono: ${formatDate(planting.planted_date)}`)
  if (planting.notes) lines.push(`Notatka: ${planting.notes}`)

  const boxWidth = 55
  const lineHeight = 5
  const boxHeight = lines.length * lineHeight + 4

  const nearRight = x > width * 0.6
  const nearBottom = y > height * 0.6
  const boxX = clamp(nearRight ? x - boxWidth - 4 : x + 4, -PADDING_CM + 1, width + PADDING_CM - boxWidth - 1)
  const boxY = nearBottom ? y - boxHeight - 4 : y + 4

  return (
    <g className="planting-tooltip" pointerEvents="none">
      <rect x={boxX} y={boxY} width={boxWidth} height={boxHeight} rx={1.5} className="tooltip-box" />
      {lines.map((line, i) => (
        <text key={i} x={boxX + 3} y={boxY + 4.5 + i * lineHeight} className={i === 0 ? 'tooltip-title' : 'tooltip-line'}>
          {line}
        </text>
      ))}
    </g>
  )
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}.${month}.${year}`
}

function DraftShape({ draft }: { draft: PlantingDraft }) {
  if (draft.type === 'point' || draft.x2 === undefined || draft.y2 === undefined) {
    return <circle cx={draft.x} cy={draft.y} r={3} className="planting-draft" />
  }

  // Długość rzędu na bieżąco, jeszcze zanim użytkownik poda odstęp w
  // formularzu - pomaga ocenić, ile roślin się zmieści, bez liczenia kratek.
  const rowLength = Math.hypot(draft.x2 - draft.x, draft.y2 - draft.y)
  const midX = (draft.x + draft.x2) / 2
  const midY = (draft.y + draft.y2) / 2

  return (
    <g>
      <line x1={draft.x} y1={draft.y} x2={draft.x2} y2={draft.y2} className="row-guide draft" />
      <circle cx={draft.x} cy={draft.y} r={3} className="planting-draft" />
      <circle cx={draft.x2} cy={draft.y2} r={3} className="planting-draft" />
      <text x={midX} y={midY - 3} className="draft-length-label" textAnchor="middle">
        {round1(rowLength)} cm
      </text>
    </g>
  )
}
