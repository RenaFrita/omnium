'use client'
import { useMemo, useState } from 'react'
import { CandleUI, AggressiveTrade } from '../types'
import * as d3 from 'd3'
import { useOrderBookStore } from '../stores/orderbook'
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
  { key: 'ema20' as const, color: '#3b82f6' }, // Blue
  { key: 'ema50' as const, color: '#f59e0b' }, // Amber
  { key: 'ema100' as const, color: '#ec4899' }, // Pink
  { key: 'ema200' as const, color: '#94a3b8' }, // Slate
]

export const Candles = ({
  candles,
  width,
  height,
  hoverX,
  indicators,
}: Props) => {
  const margin = useMemo(
    () => ({ top: 20, right: 150, bottom: 20, left: 10 }),
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

      return {
        path: lineGen(candles),
        color: config.color,
        key: config.key,
      }
    })

    return { x: xScale, y: yScale, candleWidth: cWidth, emaPaths: paths }
  }, [candles, innerWidth, innerHeight])

  const bids = useOrderBookStore((s) => s.bids)
  const asks = useOrderBookStore((s) => s.asks)

  const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null
  const currentPrice = lastCandle ? lastCandle.c : 0
  const priceColor = lastCandle ? (lastCandle.c >= lastCandle.o ? '#22c55e' : '#ef4444') : '#ffffff'

  const tickCount = Math.max(8, Math.min(14, Math.floor(innerHeight / 45)))

  const depthBars = useMemo(() => {
    if (!y || !bids.length || !asks.length) return []

    const ticks = y.ticks(tickCount)
    const tickRange = ticks.length > 1 ? ticks[1] - ticks[0] : 0
    const halfRange = tickRange / 2

    const bars = ticks.map((tickPrice) => {
      if (tickPrice <= currentPrice) {
        const bidVol = bids
          .filter((b) => Math.abs(b.price - tickPrice) <= halfRange)
          .reduce((s, b) => s + b.size, 0)
        return { y: y(tickPrice), vol: bidVol, side: 'bid' as const }
      } else {
        const askVol = asks
          .filter((a) => Math.abs(a.price - tickPrice) <= halfRange)
          .reduce((s, a) => s + a.size, 0)
        return { y: y(tickPrice), vol: askVol, side: 'ask' as const }
      }
    })

    const bidVols = bars.filter((b) => b.side === 'bid').map((b) => b.vol)
    const askVols = bars.filter((b) => b.side === 'ask').map((b) => b.vol)
    const maxBidVol = bidVols.length ? Math.max(...bidVols) : 1
    const maxAskVol = askVols.length ? Math.max(...askVols) : 1

    return bars.map((bar) => ({
      ...bar,
      maxRef: bar.side === 'bid' ? maxBidVol : maxAskVol,
    }))
  }, [y, bids, asks, currentPrice, tickCount])

  const [hoveredTrade, setHoveredTrade] = useState<{
    trade: AggressiveTrade
    cx: number
    cy: number
  } | null>(null)

  const allTrades = useTradesStore((s) => s.trades)

  const volumeProfile = useMemo(() => {
    if (!y || !allTrades.length || !candles.length) return []
    const t0 = candles[0].t
    const t1 = candles[candles.length - 1].t
    const inRange = allTrades.filter((t) => {
      const ts = t.time < 1e12 ? t.time * 1000 : t.time
      return ts >= t0 && ts <= t1
    })
    if (!inRange.length) return []

    const ticks = y.ticks(tickCount)
    const tickRange = ticks.length > 1 ? ticks[1] - ticks[0] : 0
    const halfRange = tickRange / 2

    const bars = ticks.map((tickPrice) => {
      let bidVol = 0
      let askVol = 0
      for (const t of inRange) {
        if (Math.abs(t.price - tickPrice) <= halfRange) {
          if (t.side === 'B') bidVol += t.size
          else askVol += t.size
        }
      }
      return { y: y(tickPrice), bidVol, askVol, vol: bidVol + askVol }
    })

    const maxVol = Math.max(1, ...bars.map((b) => b.vol))
    return bars.map((bar) => ({ ...bar, maxRef: maxVol }))
  }, [y, allTrades, candles, tickCount])

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
          {/* Grelha de Fundo Horizontal */}
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

          {/* Eixo Y (lado direito) */}
          <g fontSize="10" fill="#64748b" textAnchor="start">
            {y.ticks(tickCount).map((tick) => (
              <text key={tick} x={innerWidth + 8} y={y(tick) + 4}>
                {d3.format(',.2f')(tick)}
              </text>
            ))}
          </g>

          {/* Linha do Preço Atual (como TradingView) */}
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

          {/* Bookmap — profundidade do Order Book */}
          {depthBars.map((bar) => {
            if (bar.vol === 0) return null
            const barX = innerWidth + 66
            const maxW = 30
            const w = (bar.vol / bar.maxRef) * maxW
            const isBid = bar.side === 'bid'
            const fmt = d3.format('.2s')
            return (
              <g key={bar.y}>
                <rect
                  x={barX}
                  y={bar.y - 7}
                  width={Math.max(w, 1)}
                  height={14}
                  fill={isBid ? '#22c55e' : '#ef4444'}
                  opacity={0.3}
                  shapeRendering="crispEdges"
                />
                <text
                  x={barX + 2}
                  y={bar.y + 4}
                  fontSize="9"
                  fill={isBid ? '#bbf7d0' : '#fecaca'}
                  textAnchor="start"
                >
                  {fmt(bar.vol)}
                </text>
              </g>
            )
          })}

          {/* Volume Profile — volume de compra/venda por nível de preço */}
          {volumeProfile.map((bar) => {
            if (bar.vol === 0) return null
            const barX = innerWidth + 100
            const maxW = 50
            const totalW = (bar.vol / bar.maxRef) * maxW
            const dominantSide = bar.bidVol >= bar.askVol ? 'B' : 'A'
            const minorVol = Math.min(bar.bidVol, bar.askVol)
            const minorW = (minorVol / bar.maxRef) * maxW
            const fmt = d3.format('.2s')
            return (
              <g key={bar.y}>
                <rect
                  x={barX}
                  y={bar.y - 7}
                  width={Math.max(totalW, 1)}
                  height={14}
                  fill={dominantSide === 'B' ? '#22c55e' : '#ef4444'}
                  opacity={0.3}
                  shapeRendering="crispEdges"
                />
                {minorVol > 0 && (
                  <rect
                    x={barX}
                    y={bar.y - 7}
                    width={Math.max(minorW, 1)}
                    height={14}
                    fill={dominantSide === 'B' ? '#ef4444' : '#22c55e'}
                    opacity={0.5}
                    shapeRendering="crispEdges"
                  />
                )}
                <text
                  x={barX + 2}
                  y={bar.y + 4}
                  fontSize="9"
                  fill="#e2e8f0"
                  textAnchor="start"
                >
                  {fmt(bar.vol)}
                </text>
              </g>
            )
          })}

          {/* Desenho das Velas e Sinais */}
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

                {/* BOS Sinais */}
                {d.bos && (
                  <text
                    x={xPos}
                    y={d.bos === 'bullish' ? y(d.h) - 15 : y(d.l) + 25}
                    textAnchor="middle"
                    fontSize="12"
                    fill={d.bos === 'bullish' ? '#22c55e' : '#ef4444'}
                  >
                    ⚡{' '}
                    <tspan x={xPos} dy="10" fontSize="7" fontWeight="bold">
                      BOS
                    </tspan>
                  </text>
                )}

                {/* CHoCH Sinais */}
                {d.choch && (
                  <text
                    x={xPos}
                    y={d.choch === 'bullish' ? y(d.h) - 15 : y(d.l) + 25}
                    textAnchor="middle"
                    fontSize="12"
                    fill={d.choch === 'bullish' ? '#22c55e' : '#ef4444'}
                  >
                    💀{' '}
                    <tspan x={xPos} dy="10" fontSize="7" fontWeight="bold">
                      CHoCH
                    </tspan>
                  </text>
                )}
              </g>
            )
          })}

          {/* Price Line (ligando as trades agressivas) */}
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

          {/* Renderização Condicional das EMAs */}
          {emaPaths
            .filter((ema) => indicators[ema.key]) // Aqui ligamos/desligamos
            .map((ema) => (
              <path
                key={ema.key}
                d={ema.path || ''}
                fill="none"
                stroke={ema.color}
                strokeWidth={1.5}
                strokeLinecap="round"
                opacity={0.8}
                style={{ transition: 'opacity 0.2s' }}
              />
            ))}

          {/* Aggressive Trades (bolas do bookmap) */}
          {visibleTrades.map((t, i) => {
            const ts = t.time < 1e12 ? t.time * 1000 : t.time
            const cx = x(new Date(ts))
            if (cx < 0 || cx > innerWidth) return null
            const cy = y(t.price)
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={Math.max(1.5, Math.min(8, Math.sqrt(Math.abs(t.size)) * 2.5))}
                fill={t.side === 'B' ? '#22c55e' : '#ef4444'}
                opacity={0.7}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredTrade({ trade: t, cx, cy })}
                onMouseLeave={() => setHoveredTrade(null)}
              />
            )
          })}

          {/* Tooltip das ordens agressivas */}
          {hoveredTrade && (
            <foreignObject
              x={hoveredTrade.cx + 8}
              y={hoveredTrade.cy - 50}
              width={130}
              height={55}
              style={{ overflow: 'visible', pointerEvents: 'none' }}
            >
              <div className="bg-slate-950/90 backdrop-blur-md border border-slate-700 px-2.5 py-1.5 rounded shadow-2xl text-[10px]">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Price</span>
                  <span className="text-white font-bold tabular-nums">
                    {hoveredTrade.trade.price}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Size</span>
                  <span className="text-white font-bold tabular-nums">
                    {hoveredTrade.trade.size.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Side</span>
                  <span
                    className={
                      hoveredTrade.trade.side === 'B'
                        ? 'text-emerald-400 font-bold'
                        : 'text-rose-400 font-bold'
                    }
                  >
                    {hoveredTrade.trade.side === 'B' ? 'BUY' : 'SELL'}
                  </span>
                </div>
              </div>
            </foreignObject>
          )}

          {/* Cursor Vertical (Crosshair) */}
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
