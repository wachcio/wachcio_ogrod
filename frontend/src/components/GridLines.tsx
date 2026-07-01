// Siatka pomocnicza dla widoków SVG rysowanych w skali cm (GardenCanvas,
// PlantingCanvas) - ułatwia orientację w rzeczywistych wymiarach na planie.
export function GridLines({ width, height, step }: { width: number; height: number; step: number }) {
  const verticalLines = []
  for (let x = 0; x <= width; x += step) {
    verticalLines.push(<line key={`v-${x}`} x1={x} y1={0} x2={x} y2={height} className="grid-line" />)
  }

  const horizontalLines = []
  for (let y = 0; y <= height; y += step) {
    horizontalLines.push(<line key={`h-${y}`} x1={0} y1={y} x2={width} y2={y} className="grid-line" />)
  }

  return (
    <>
      {verticalLines}
      {horizontalLines}
    </>
  )
}
