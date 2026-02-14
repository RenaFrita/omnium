import { useMemo } from 'react'
import { CandleUI } from '../types'
import * as d3 from 'd3'

interface Props {
  width: number
  height: number
  candles: CandleUI[]
  hoverX?: number
}

export const Volume = ({ width, height, candles, hoverX }: Props) => {
  const margin = useMemo(
    () => ({ top: 5, right: 50, bottom: 20, left: 60 }),
    []
  )

  const innerWidth = Math.floor(Math.max(0, width - margin.left - margin.right))
  const innerHeight = Math.floor(
    Math.max(0, height - margin.top - margin.bottom)
  )

  const { x, y, barWidth } = useMemo(() => {
    if (!candles.length || innerWidth <= 0 || innerHeight <= 0)
      return { x: null, y: null, barWidth: 0 }

    const timeExtent = d3.extent(candles, (d) => d.t) as [number, number]
    const step = candles.length > 1 ? candles[1].t - candles[0].t : 60_000

    const xScale = d3
      .scaleTime()
      .domain([
        new Date(timeExtent[0] - step / 2),
        new Date(timeExtent[1] + step / 2),
      ])
      .range([0, innerWidth])

    const volMax = d3.max(candles, (d) => d.v) || 0
    const yScale = d3
      .scaleLinear()
      .domain([0, volMax * 1.05])
      .range([innerHeight, 0])

    const bWidth = Math.max(1, (innerWidth / candles.length) * 0.8)

    return { x: xScale, y: yScale, barWidth: bWidth }
  }, [candles, innerWidth, innerHeight])

  if (width <= 0 || height <= 0 || !x || !y) return null

  return (
    <div style={{ width: '100%', height: '20%', contain: 'strict' }}>
      <svg
        width={width}
        height={height}
        style={{
          display: 'block',
          pointerEvents: 'none',
          shapeRendering: 'crispEdges',
        }}
      >
        <g transform={`translate(${margin.left},${margin.top})`}>
          <g
            className="y-axis-labels"
            fontSize="10"
            fill="#666"
            textAnchor="end"
          >
            {y.ticks(4).map((tick) => (
              <text key={tick} x="-5" y={y(tick) + 4}>
                {d3.format('.2s')(tick)}
              </text>
            ))}
          </g>

          {candles.map((d) => {
            const barHeight = Math.max(0, innerHeight - y(d.v))
            return (
              <rect
                key={d.t}
                x={x(new Date(d.t)) - barWidth / 2}
                y={y(d.v)}
                width={barWidth}
                height={barHeight}
                fill={
                  d.isVolumeSpike
                    ? '#facc15'
                    : d.c >= d.o
                      ? '#22c55e'
                      : '#ef4444'
                }
                shapeRendering="crispEdges"
              />
            )
          })}
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
