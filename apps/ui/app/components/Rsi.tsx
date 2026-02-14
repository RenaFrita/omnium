import { useMemo } from 'react'
import { CandleUI } from '../types'
import * as d3 from 'd3'

interface Props {
  width: number
  height: number
  candles: CandleUI[]
  hoverX?: number
}

export const Rsi = ({ width, height, candles, hoverX }: Props) => {
  // 1. Aumentamos o bottom para 35 para caber o texto do eixo X
  const margin = useMemo(
    () => ({ top: 10, right: 50, bottom: 35, left: 60 }),
    []
  )
  const innerWidth = Math.max(0, width - margin.left - margin.right)
  const innerHeight = Math.max(0, height - margin.top - margin.bottom)

  const { pathData, x, y, timeTicks } = useMemo(() => {
    if (!candles.length || innerWidth <= 0 || innerHeight <= 0) {
      return { pathData: null, x: null, y: null, timeTicks: [] }
    }

    const timeExtent = d3.extent(candles, (d) => d.t) as [number, number]
    const step = candles.length > 1 ? candles[1].t - candles[0].t : 60_000

    const xScale = d3.scaleTime()
      .domain([
        new Date(timeExtent[0] - step / 2),
        new Date(timeExtent[1] + step / 2),
      ])
      .range([0, innerWidth])

    const yScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0])

    const lineGenerator = d3.line<CandleUI>()
      .defined((d) => d.rsi !== undefined && !isNaN(d.rsi))
      .x((d) => xScale(new Date(d.t)))
      .y((d) => yScale(d.rsi as number))
      .curve(d3.curveMonotoneX)

    // Gerar aproximadamente 5 a 8 etiquetas de tempo dependendo da largura
    const ticks = xScale.ticks(Math.max(2, Math.floor(innerWidth / 90)))

    return {
      pathData: lineGenerator(candles),
      x: xScale,
      y: yScale,
      timeTicks: ticks
    }
  }, [candles, innerWidth, innerHeight])

  if (!x || !y || width <= 0 || height <= 0) return null

  return (
    <div style={{ width: '100%', height: '20%', contain: 'strict' }}>
      <svg width={width} height={height} style={{ display: 'block' }}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Linhas de Referência RSI */}
          <line x1={0} x2={innerWidth} y1={y(70)} y2={y(70)} stroke="#333" strokeDasharray="4,4" />
          <line x1={0} x2={innerWidth} y1={y(30)} y2={y(30)} stroke="#333" strokeDasharray="4,4" />
          <line x1={0} x2={innerWidth} y1={y(50)} y2={y(50)} stroke="#222" strokeOpacity="0.5" />

          {/* Eixo Y (Níveis RSI) */}
          <g fontSize="9" fill="#666" textAnchor="end">
            {[30, 50, 70].map((tick) => (
              <text key={tick} x="-5" y={y(tick) + 3}>{tick}</text>
            ))}
          </g>

          {/* EIXO X (TEMPO) */}
          <g transform={`translate(0, ${innerHeight + 20})`}>
            {timeTicks.map((tick, i) => (
              <text
                key={i}
                x={x(tick)}
                fontSize="10"
                fill="#888"
                textAnchor="middle"
              >
                {d3.timeFormat("%H:%M")(tick)}
              </text>
            ))}
          </g>

          {/* Linha RSI */}
          {pathData && (
            <path
              d={pathData}
              fill="none"
              stroke="#a855f7"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* Crosshair Vertical - Estendido para o eixo do tempo */}
          {hoverX !== undefined && (
            <line
              x1={hoverX}
              x2={hoverX}
              y1={0}
              y2={innerHeight + 25}
              stroke="#ffffff"
              strokeWidth={1}
              strokeDasharray="4,4"
              style={{ opacity: 0.4, pointerEvents: 'none' }}
            />
          )}
        </g>
      </svg>
    </div>
  )
}
