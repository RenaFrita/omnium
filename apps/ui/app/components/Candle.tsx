import { Candle } from "../types"

interface CandleProps {
  x: number
  width: number
  candle: Candle
  scaleY: (value: number) => number
  dataKey: string
}

// Componente que desenha cada candle
const CandleShape = ({ x, width, candle, scaleY }: CandleProps) => {
  const color = candle.c >= candle.o ? '#4caf50' : '#f44336' // verde se sobe, vermelho se desce

  const openY = scaleY(candle.o)
  const closeY = scaleY(candle.c)
  const highY = scaleY(candle.h)
  const lowY = scaleY(candle.l)

  const bodyY = Math.min(openY, closeY)
  const bodyHeight = Math.abs(closeY - openY)
  const wickX = x + width / 2

  return (
    <>
      {/* Wick */}
      <line
        x1={wickX}
        x2={wickX}
        y1={highY}
        y2={lowY}
        stroke={color}
        strokeWidth={1}
      />
      {/* Body */}
      <rect
        x={x}
        y={bodyY}
        width={width}
        height={bodyHeight || 1} // garante pelo menos 1px
        fill={color}
      />
    </>
  )
}

export default CandleShape