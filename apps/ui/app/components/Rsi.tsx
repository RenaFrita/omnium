'use client'
import { useMemo } from 'react'
import * as d3 from 'd3'
import { CandleUI } from '../types'

interface Props {
  width: number
  height: number
  candles: CandleUI[]
  hoverX?: number
}

export const Rsi = ({ width, height, candles, hoverX }: Readonly<Props>) => {
  const margin = useMemo(
    () => ({ top: 10, right: 70, bottom: 35, left: 10 }),
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
    <div style={{ width: '100%', height: '100%', contain: 'strict' }}>
      <svg width={width} height={height} style={{ display: 'block' }}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          <line x1={0} x2={innerWidth} y1={y(70)} y2={y(70)} stroke="#333" strokeDasharray="4,4" />
          <line x1={0} x2={innerWidth} y1={y(30)} y2={y(30)} stroke="#333" strokeDasharray="4,4" />
          <line x1={0} x2={innerWidth} y1={y(50)} y2={y(50)} stroke="#222" strokeOpacity="0.5" />

          <g fontSize="10" fill="#64748b" textAnchor="start">
            {[30, 50, 70].map((tick) => (
              <text key={tick} x={innerWidth + 8} y={y(tick) + 4}>{tick}</text>
            ))}
          </g>

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
