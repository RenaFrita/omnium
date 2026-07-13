'use client'
import { useMemo } from 'react'
import * as d3 from 'd3'
import { CandleUI, AggressiveTrade } from '../types'
import { useTradesStore } from '../stores/trades'

interface Props {
  candles: CandleUI[]
  width: number
  height: number
  hoverX?: number
  indicators: {
    ema20: boolean
    ema50: boolean
    ema100: boolean
    ema200: boolean
  }
}

const emaConfigs = [
  { key: 'ema20' as const, color: '#3b82f6' },
  { key: 'ema50' as const, color: '#f59e0b' },
  { key: 'ema100' as const, color: '#ec4899' },
  { key: 'ema200' as const, color: '#94a3b8' },
]

export const Candles = ({
  candles,
  width,
  height,
  hoverX,
  indicators,
}: Readonly<Props>) => {
  const margin = useMemo(
    () => ({ top: 20, right: 70, bottom: 20, left: 10 }),
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

    const paths = emaConfigs
      .filter((config) => indicators[config.key])
      .map((config) => {
        const lineGen = d3
          .line<CandleUI>()
          .defined((d) => d[config.key] !== undefined && d[config.key] !== null)
          .x((d) => xScale(new Date(d.t)))
          .y((d) => yScale(d[config.key]!))
          .curve(d3.curveMonotoneX)

        return {
          path: lineGen(candles),
          color: config.color,
          key: config.key,
        }
      })

    return { x: xScale, y: yScale, candleWidth: cWidth, emaPaths: paths }
  }, [candles, innerWidth, innerHeight, indicators])

  const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null
  const currentPrice = lastCandle ? lastCandle.c : 0
  const priceColor = lastCandle ? (lastCandle.c >= lastCandle.o ? '#22c55e' : '#ef4444') : '#ffffff'

  const tickCount = Math.max(8, Math.min(14, Math.floor(innerHeight / 45)))

  const allTrades = useTradesStore((s) => s.trades)

  const visibleTrades = useMemo(() => {
    if (!x || !candles.length) return []
    const t0 = candles[0].t
    const t1 = candles[candles.length - 1].t
    const inRange = allTrades.filter((t) => {
      const ts = t.time < 1e12 ? t.time * 1000 : t.time
      return ts >= t0 && ts <= t1
    })
    if (inRange.length < 10) return inRange
    const sizes = inRange.map((t) => t.size).sort((a, b) => a - b)
    const threshold = sizes[Math.floor(sizes.length * 0.75)]
    return inRange.filter((t) => t.size >= threshold)
  }, [allTrades, x, candles])

  const tradePriceLinePath = useMemo(() => {
    if (!x || !y || !visibleTrades.length) return null
    const sorted = [...visibleTrades].sort((a, b) => a.time - b.time)
    if (sorted.length < 2) return null
    const line = d3
      .line<AggressiveTrade>()
      .x((d) => x(new Date(d.time < 1e12 ? d.time * 1000 : d.time)))
      .y((d) => y(d.price))
    return line(sorted)
  }, [visibleTrades, x, y])

  if (!x || !y) return null

  return (
    <div style={{ width: '100%', height: '100%', contain: 'strict' }}>
      <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          <g opacity={0.05}>
            {y.ticks(tickCount).map((tick) => (
              <line
                key={`grid-${tick}`}
                x1={0}
                x2={innerWidth}
                y1={y(tick)}
                y2={y(tick)}
                stroke="white"
              />
            ))}
          </g>

          <g fontSize="10" fill="#64748b" textAnchor="start">
            {y.ticks(tickCount).map((tick) => (
              <text key={tick} x={innerWidth + 8} y={y(tick) + 4}>
                {d3.format(',.2f')(tick)}
              </text>
            ))}
          </g>

          {emaPaths.map(
            ({ path, color, key }) =>
              path && (
                <path
                  key={key}
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.5}
                  opacity={0.8}
                />
              )
          )}

          {currentPrice > 0 && y(currentPrice) > 0 && y(currentPrice) < innerHeight && (
            <g>
              <line
                x1={0}
                x2={innerWidth + 60}
                y1={y(currentPrice)}
                y2={y(currentPrice)}
                stroke={priceColor}
                strokeWidth={1}
                strokeDasharray="4,3"
                opacity={0.7}
              />
              <rect
                x={innerWidth + 4}
                y={y(currentPrice) - 8}
                width={62}
                height={16}
                rx={3}
                fill={priceColor}
              />
              <text
                x={innerWidth + 8}
                y={y(currentPrice) + 4}
                fontSize="10"
                fontWeight="bold"
                fill="#fff"
                textAnchor="start"
              >
                {d3.format(',.2f')(currentPrice)}
              </text>
            </g>
          )}

          {candles.map((d) => {
            const isBullish = d.c >= d.o
            const color = isBullish ? '#22c55e' : '#ef4444'
            const xPos = x(new Date(d.t))

            return (
              <g key={d.t}>
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

                {d.bos && (
                  <text
                    x={xPos}
                    y={d.bos === 'bullish' ? y(d.h) - 15 : y(d.l) + 25}
                    textAnchor="middle"
                    fontSize="12"
                    fill={d.bos === 'bullish' ? '#22c55e' : '#ef4444'}
                    fontWeight="bold"
                  >
                    ⚡
                  </text>
                )}

                {d.choch && (
                  <text
                    x={xPos}
                    y={d.choch === 'bullish' ? y(d.h) - 15 : y(d.l) + 25}
                    textAnchor="middle"
                    fontSize="12"
                    fill={d.choch === 'bullish' ? '#22c55e' : '#ef4444'}
                    fontWeight="bold"
                  >
                    ☠️
                  </text>
                )}
              </g>
            )
          })}

          {tradePriceLinePath && (
            <path
              d={tradePriceLinePath}
              fill="none"
              stroke="#ffffff"
              strokeWidth={1}
              opacity={0.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {hoverX !== undefined && (
            <line
              x1={hoverX}
              x2={hoverX}
              y1={0}
              y2={innerHeight}
              stroke="#ffffff"
              strokeWidth={1}
              strokeDasharray="4,4"
              style={{ opacity: 0.3, pointerEvents: 'none' }}
            />
          )}
        </g>
      </svg>
    </div>
  )
}
