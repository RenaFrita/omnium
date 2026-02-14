import { useMemo } from 'react'
import { CandleUI } from '../types'
import * as d3 from 'd3'

interface Props {
  candles: CandleUI[]
  width: number
  height: number
  hoverX?: number
}

const emaConfigs = [
  { key: 'ema20' as const, color: '#3b82f6' },
  { key: 'ema50' as const, color: '#f59e0b' },
  { key: 'ema100' as const, color: '#ec4899' },
  { key: 'ema200' as const, color: '#94a3b8' },
]

export const Candles = ({ candles, width, height, hoverX }: Props) => {
  const margin = useMemo(
    () => ({ top: 20, right: 50, bottom: 20, left: 60 }),
    []
  )
  const innerWidth = Math.max(0, width - margin.left - margin.right)
  const innerHeight = Math.max(0, height - margin.top - margin.bottom)

  const { x, y, candleWidth, emaPaths } = useMemo(() => {
    if (!candles.length || innerWidth <= 0 || innerHeight <= 0) {
      return { x: null, y: null, candleWidth: 0, emaPaths: [] }
    }

    const timeExtent = d3.extent(candles, (d) => d.t) as [number, number]
    const step = candles.length > 1 ? candles[1].t - candles[0].t : 60_000

    const xScale = d3
      .scaleTime()
      .domain([
        new Date(timeExtent[0] - step / 2),
        new Date(timeExtent[1] + step / 2),
      ])
      .range([0, innerWidth])

    const minP = d3.min(candles, (d) => d.l)!
    const maxP = d3.max(candles, (d) => d.h)!
    const yScale = d3
      .scaleLinear()
      .domain([minP * 0.998, maxP * 1.002])
      .range([innerHeight, 0])

    const cWidth = Math.max(2, (innerWidth / candles.length) * 0.7)

    const paths = emaConfigs.map((config) => {
      const lineGen = d3
        .line<CandleUI>()
        .defined((d) => d[config.key] !== undefined && d[config.key] !== null)
        .x((d) => xScale(new Date(d.t)))
        .y((d) => yScale(d[config.key]!))
        .curve(d3.curveMonotoneX)
      return { path: lineGen(candles), color: config.color, key: config.key }
    })

    return { x: xScale, y: yScale, candleWidth: cWidth, emaPaths: paths }
  }, [candles, innerWidth, innerHeight])

  if (!x || !y) return null

  return (
    <div style={{ width: '100%', height: '60%', contain: 'strict' }}>
      <svg width={width} height={height} style={{ display: 'block' }}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Eixo Y */}
          <g fontSize="10" fill="#444" textAnchor="end">
            {y.ticks(6).map((tick) => (
              <text key={tick} x="-5" y={y(tick) + 4}>
                {d3.format(',.2f')(tick)}
              </text>
            ))}
          </g>

          {candles.map((d) => {
            const isBullish = d.c >= d.o
            const color = isBullish ? '#22c55e' : '#ef4444'
            const xPos = x(new Date(d.t))

            return (
              <g key={d.t}>
                {/* Candle Wick & Body */}
                <line
                  x1={xPos}
                  x2={xPos}
                  y1={y(d.h)}
                  y2={y(d.l)}
                  stroke={color}
                  strokeWidth={1}
                />
                <rect
                  x={xPos - candleWidth / 2}
                  y={y(Math.max(d.o, d.c))}
                  width={candleWidth}
                  height={Math.max(1, Math.abs(y(d.o) - y(d.c)))}
                  fill={color}
                  shapeRendering="crispEdges"
                />

                {/* BOS - Raio (⚡) */}
                {d.bos && (
                  <text
                    x={xPos}
                    y={d.bos === 'bullish' ? y(d.h) - 15 : y(d.l) + 25}
                    textAnchor="middle"
                    fontSize="14"
                    fill={d.bos === 'bullish' ? '#22c55e' : '#ef4444'}
                    style={{ fontWeight: 'bold' }}
                  >
                    ⚡
                    <tspan x={xPos} dy="10" fontSize="8">
                      BOS
                    </tspan>
                  </text>
                )}

                {/* CHoCH - Caveira (💀) */}
                {d.choch && (
                  <text
                    x={xPos}
                    y={d.choch === 'bullish' ? y(d.h) - 15 : y(d.l) + 25}
                    textAnchor="middle"
                    fontSize="14"
                    fill={d.choch === 'bullish' ? '#22c55e' : '#ef4444'}
                  >
                    💀
                    <tspan x={xPos} dy="10" fontSize="8">
                      CHoCH
                    </tspan>
                  </text>
                )}
              </g>
            )
          })}

          {/* EMAs */}
          {emaPaths.map((ema) => (
            <path
              key={ema.key}
              d={ema.path || ''}
              fill="none"
              stroke={ema.color}
              strokeWidth={1.5}
              opacity={0.6}
            />
          ))}

          {hoverX !== undefined && (
            <line
              x1={hoverX}
              x2={hoverX}
              y1={0}
              y2={innerHeight}
              stroke="#ffffff"
              strokeWidth={1}
              strokeDasharray="4,4"
              style={{ opacity: 0.5, pointerEvents: 'none' }}
            />
          )}
        </g>
      </svg>
    </div>
  )
}
