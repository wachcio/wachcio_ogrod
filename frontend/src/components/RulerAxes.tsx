// Linijka z podziałką (cm) wzdłuż górnej i lewej krawędzi planu - ułatwia
// odczytanie rzeczywistych odległości podczas sadzenia bez liczenia kratek.
// Rysowana w przestrzeni PADDING_CM zarezerwowanej wokół grządki (patrz
// PlantingCanvas/GardenCanvas), więc nie zasłania samej grządki.
export function RulerAxes({ width, height, step }: { width: number; height: number; step: number }) {
  const xTicks = buildTicks(width, step)
  const yTicks = buildTicks(height, step)

  return (
    <g className="ruler-axes">
      {xTicks.map((x) => (
        <g key={`x-${x}`}>
          <line x1={x} y1={-3} x2={x} y2={0} className="ruler-tick" />
          <text x={x} y={-4.5} className="ruler-label" textAnchor="middle">
            {x}
          </text>
        </g>
      ))}
      {yTicks.map((y) => (
        <g key={`y-${y}`}>
          <line x1={-3} y1={y} x2={0} y2={y} className="ruler-tick" />
          <text x={-4.5} y={y} className="ruler-label" textAnchor="end" dominantBaseline="middle">
            {y}
          </text>
        </g>
      ))}
    </g>
  )
}

// Podziałka co `step`, plus dokładny wymiar krawędzi na końcu (jeśli nie
// pokrywa się z ostatnią regularną kreską) - żeby zawsze było widać pełną
// szerokość/długość grządki, nawet gdy nie jest wielokrotnością kroku.
function buildTicks(max: number, step: number): number[] {
  const ticks: number[] = []
  for (let v = 0; v <= max; v += step) {
    ticks.push(v)
  }
  const last = ticks[ticks.length - 1] ?? 0
  if (max - last > step * 0.3) {
    ticks.push(max)
  }
  return ticks
}
