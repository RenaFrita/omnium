'use client'

import { useHyperliquid } from '../hooks/useHyperliquid'
import { useEffect, useRef, useMemo } from 'react'
import * as d3 from 'd3'
import {
  calculateEMA,
  calculateRSI,
  detectBOS,
  detectStructure,
  detectVolumeSpike,
} from '../helpers'
import { useChartDimensions } from '../hooks/useChartDimensions'

interface Props {
  interval: string
  coin: string
}

export const CandleChart = ({ coin, interval }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const candles = useHyperliquid(coin, interval)
  const dimensions = useChartDimensions(containerRef)

  // ================= INDICATORS =================

  const { ema20, ema50, ema100, ema200, rsi, bos, volumeSpike } =
    useMemo(() => {
      const closes: number[] = []
      const volumes: number[] = []

      // Preenche closes e volumes em um único loop
      for (let i = 0; i < candles.length; i++) {
        closes.push(candles[i].c)
        volumes.push(candles[i].v)
      }

      // Calcula indicadores
      const ema20 = calculateEMA(closes, 20)
      const ema50 = calculateEMA(closes, 50)
      const ema100 = calculateEMA(closes, 100)
      const ema200 = calculateEMA(closes, 200)
      const rsi = calculateRSI(closes, 14)

      // Detecta estrutura e BOS
      const structure = detectStructure(candles)
      const bos = detectBOS(structure)

      // Detecta spikes de volume
      const volumeSpike = detectVolumeSpike(volumes)

      return { ema20, ema50, ema100, ema200, rsi, bos, volumeSpike }
    }, [candles])

  // ================= DRAW =================

  useEffect(() => {
    const { width, height } = dimensions
    if (!candles.length || !width || !height) return

    const margin = { top: 20, right: 50, bottom: 30, left: 60 }
    const rsiGap = 30
    const rsiHeight = height * 0.25
    const priceHeight = height - rsiHeight - margin.bottom - rsiGap

    const innerWidth = width - margin.left - margin.right
    const innerPriceHeight = priceHeight - margin.top
    const innerRsiHeight = rsiHeight - 20

    const svg = d3.select(svgRef.current)
    svg.attr('viewBox', `0 0 ${width} ${height}`)

    // ================= GROUPS =================

    let priceG = svg.select<SVGGElement>('.price-group')
    if (priceG.empty()) {
      priceG = svg.append('g').attr('class', 'price-group')
    }
    priceG.attr('transform', `translate(${margin.left},${margin.top})`)

    let rsiG = svg.select<SVGGElement>('.rsi-group')
    if (rsiG.empty()) {
      rsiG = svg.append('g').attr('class', 'rsi-group')
    }
    rsiG.attr('transform', `translate(${margin.left},${priceHeight + rsiGap})`)

    // ================= SCALES =================

    const timeExtent = d3.extent(candles, (d) => d.t) as [number, number]
    const step = candles.length > 1 ? candles[1].t - candles[0].t : 60_000

    const x = d3
      .scaleTime()
      .domain([
        new Date(timeExtent[0] - step / 2),
        new Date(timeExtent[1] + step / 2),
      ])
      .range([0, innerWidth])

    const y = d3
      .scaleLinear()
      .domain([
        d3.min(candles, (d) => d.l)! * 0.995,
        d3.max(candles, (d) => d.h)! * 1.005,
      ])
      .nice()
      .range([innerPriceHeight, 0])

    const rsiScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([innerRsiHeight, 0])

    // ================= AXES =================

    priceG
      .selectAll<SVGGElement, null>('.x-axis')
      .data([null])
      .join('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerPriceHeight})`)
      .call(d3.axisBottom(x))

    priceG
      .selectAll<SVGGElement, null>('.y-axis')
      .data([null])
      .join('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y))

    rsiG
      .selectAll<SVGGElement, null>('.rsi-axis')
      .data([null])
      .join('g')
      .attr('class', 'rsi-axis')
      .call(d3.axisLeft(rsiScale).tickValues([0, 50, 100]))

    // ================= CANDLES =================

    const xPositions = candles.map((d) => x(new Date(d.t)))
    const minDistance = d3.min(
      xPositions.slice(1).map((pos, i) => pos - xPositions[i])
    )
    const candleWidth = Math.max(2, (minDistance ?? 10) * 0.6)

    // Wicks
    priceG
      .selectAll<SVGLineElement, typeof candles>('.wick')
      .data(candles)
      .join('line')
      .attr('class', 'wick')
      .attr('x1', (d) => x(new Date(d.t)))
      .attr('x2', (d) => x(new Date(d.t)))
      .attr('y1', (d) => y(d.h))
      .attr('y2', (d) => y(d.l))
      .attr('stroke', (d) => (d.c >= d.o ? '#16a34a' : '#dc2626'))

    // Bodies
    priceG
      .selectAll<SVGRectElement, typeof candles>('.body')
      .data(candles)
      .join('rect')
      .attr('class', 'body')
      .attr('x', (d) => x(new Date(d.t)) - candleWidth / 2)
      .attr('y', (d) => y(Math.max(d.o, d.c)))
      .attr('width', candleWidth)
      .attr('height', (d) => Math.max(1, Math.abs(y(d.o) - y(d.c))))
      .attr('fill', (d) => (d.c >= d.o ? '#16a34a' : '#dc2626'))
      .attr('stroke', (_, i) => (volumeSpike[i] ? '#facc15' : 'none'))
      .attr('stroke-width', (_, i) => (volumeSpike[i] ? 2 : 0))

    // ================= BOS =================
    priceG
      .selectAll<SVGCircleElement, typeof candles>('.bos')
      .data(candles)
      .join('circle')
      .attr('class', 'bos')
      .attr('cx', (d) => x(new Date(d.t)))
      .attr('cy', (d, i) => (bos[i] ? y(Math.max(d.o, d.c, d.h)) - 8 : -100))
      .attr('r', (_, i) => (bos[i] ? 4 : 0))
      .attr('fill', 'purple')

    // ================= EMA =================
    const priceLine = d3
      .line<number>()
      .defined((d) => d !== undefined)
      .x((_, i) => x(new Date(candles[i].t)))
      .y((d) => y(d))

    const emaPaths = [
      { data: ema20, color: '#3b82f6', key: 'ema20' },
      { data: ema50, color: '#f59e0b', key: 'ema50' },
      { data: ema100, color: '#eca1a6', key: 'ema100' },
      { data: ema200, color: '#d6cbd3', key: 'ema200' },
    ]
    
    priceG
      .selectAll<
        SVGPathElement,
        { data: number[]; color: string; key: string }
      >('.ema')
      .data(emaPaths, (d) => d.key)
      .join('path')
      .attr('class', 'ema')
      .attr('fill', 'none')
      .attr('stroke-width', 1.5)
      .attr('stroke', (d) => d.color)
      .attr('d', (d) => priceLine(d.data))

    // ================= RSI =================
    const rsiData = candles.map((c, i) => ({ t: c.t, value: rsi[i] }))
    const rsiLine = d3
      .line<{ t: number; value: number }>()
      .defined((d) => d.value !== undefined)
      .x((d) => x(new Date(d.t)))
      .y((d) => rsiScale(d.value))

    rsiG
      .selectAll<SVGPathElement, (typeof rsiData)[]>('.rsi-line')
      .data([rsiData])
      .join('path')
      .attr('class', 'rsi-line')
      .attr('fill', 'none')
      .attr('stroke', '#a855f7')
      .attr('stroke-width', 1.5)
      .attr('d', rsiLine)
  }, [candles, dimensions, ema20, ema50, ema100, ema200, rsi, volumeSpike, bos])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} />
    </div>
  )
}
