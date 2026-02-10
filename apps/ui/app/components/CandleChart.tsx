'use client'

import { useHyperliquid } from '../hooks/useHyperliquid'
import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import {
  calculateEMA,
  calculateRSI,
  detectBOS,
  detectStructure,
  detectVolumeSpike,
} from '../helpers'

interface Props {
  interval: string
  coin: string
}

export const CandleChart = ({ coin, interval }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const candles = useHyperliquid(coin, interval)

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setDimensions({ width, height })
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const { width, height } = dimensions
    if (!candles.length || !width || !height) return

    // ================= INDICATORS =================

    const closes = candles.map((c) => c.c)
    const volumes = candles.map((c) => c.v)

    const ema20 = calculateEMA(closes, 20)
    const ema50 = calculateEMA(closes, 50)
    const ema100 = calculateEMA(closes, 100)
    const ema200 = calculateEMA(closes, 200)
    const rsi = calculateRSI(closes, 14)

    const structure = detectStructure(candles)
    const bos = detectBOS(structure)
    const volumeSpike = detectVolumeSpike(volumes)

    // ================= LAYOUT =================

    const margin = { top: 20, right: 50, bottom: 30, left: 60 }
    const rsiGap = 30 // espaço entre o gráfico de preço e RSI

    const rsiHeight = height * 0.25
    const priceHeight = height - rsiHeight - margin.bottom - rsiGap

    const innerWidth = width - margin.left - margin.right
    const innerPriceHeight = priceHeight - margin.top
    const innerRsiHeight = rsiHeight - 20

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('width', '100%')
      .style('height', '100%')

    const priceG = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const rsiG = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${priceHeight + rsiGap})`) // adiciona gap

    // ================= SCALES =================

    const timeExtent = d3.extent(candles, (d) => d.t) as [number, number]
    const step = candles.length > 1 ? candles[1].t - candles[0].t : 60_000

    const x = d3
      .scaleTime()
      .domain([new Date(timeExtent[0] - step), new Date(timeExtent[1] + step)])
      .range([0, innerWidth])

    const y = d3
      .scaleLinear()
      .domain([
        d3.min(candles, (d) => d.l)! * 0.995,
        d3.max(candles, (d) => d.h)! * 1.005,
      ]) // margem extra
      .nice()
      .range([innerPriceHeight, 0])

    const rsiScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([innerRsiHeight, 0])

    // ================= AXES =================

    // Price axes
    priceG
      .append('g')
      .attr('transform', `translate(0,${innerPriceHeight})`)
      .call(d3.axisBottom(x))

    priceG.append('g').call(d3.axisLeft(y))

    // RSI Y axis (0, 50, 100)
    rsiG.append('g').call(d3.axisLeft(rsiScale).tickValues([0, 50, 100]))

    // ================= CANDLES =================

    const xPositions = candles.map((d) => x(new Date(d.t)))
    const minDistance = d3.min(
      xPositions.slice(1).map((pos, i) => pos - xPositions[i])
    )
    const candleWidth = Math.max(2, (minDistance ?? 10) * 0.6)

    priceG
      .selectAll('.wick')
      .data(candles)
      .enter()
      .append('line')
      .attr('x1', (d) => x(new Date(d.t)))
      .attr('x2', (d) => x(new Date(d.t)))
      .attr('y1', (d) => y(d.h))
      .attr('y2', (d) => y(d.l))
      .attr('stroke', (d) => (d.c >= d.o ? '#16a34a' : '#dc2626'))

    priceG
      .selectAll('.body')
      .data(candles)
      .enter()
      .append('rect')
      .attr('x', (d) => x(new Date(d.t)) - candleWidth / 2)
      .attr('y', (d) => y(Math.max(d.o, d.c)))
      .attr('width', candleWidth)
      .attr('height', (d) => Math.max(1, Math.abs(y(d.o) - y(d.c))))
      .attr('fill', (d) => (d.c >= d.o ? '#16a34a' : '#dc2626'))
      .attr('stroke', (_, i) => (volumeSpike[i] ? '#facc15' : 'none'))
      .attr('stroke-width', (_, i) => (volumeSpike[i] ? 2 : 0))

    // ================= EMA =================

    const priceLine = d3
      .line<number>()
      .defined((d) => d !== undefined)
      .x((_, i) => x(new Date(candles[i].t)))
      .y((d) => y(d))

    priceG
      .append('path')
      .datum(ema20)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 1.5)
      .attr('d', priceLine)

    priceG
      .append('path')
      .datum(ema50)
      .attr('fill', 'none')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 1.5)
      .attr('d', priceLine)

    priceG
      .append('path')
      .datum(ema100)
      .attr('fill', 'none')
      .attr('stroke', '#eca1a6')
      .attr('stroke-width', 1.5)
      .attr('d', priceLine)
      
     priceG
      .append('path')
      .datum(ema200)
      .attr('fill', 'none')
      .attr('stroke', '#d6cbd3')
      .attr('stroke-width', 1.5)
      .attr('d', priceLine) 

    // ================= BOS =================

    priceG
      .selectAll('.bos')
      .data(candles)
      .enter()
      .append('circle')
      .attr('cx', (d) => x(new Date(d.t)))
      .attr('cy', (d, i) => (bos[i] ? y(d.h) - 8 : -100))
      .attr('r', (_, i) => (bos[i] ? 4 : 0))
      .attr('fill', 'purple')

    // ================= RSI =================

    // RSI guide lines
    rsiG
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', rsiScale(70))
      .attr('y2', rsiScale(70))
      .attr('stroke', '#444')
      .attr('stroke-dasharray', '4')

    rsiG
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', rsiScale(30))
      .attr('y2', rsiScale(30))
      .attr('stroke', '#444')
      .attr('stroke-dasharray', '4')

    const rsiData = candles.map((c, i) => ({
      t: c.t,
      value: rsi[i],
    }))

    const rsiLine = d3
      .line<{ t: number; value: number | undefined }>()
      .defined((d) => d.value !== undefined)
      .x((d) => x(new Date(d.t)))
      .y((d) => rsiScale(d.value as number))

    rsiG
      .append('path')
      .datum(rsiData)
      .attr('fill', 'none')
      .attr('stroke', '#a855f7')
      .attr('stroke-width', 1.5)
      .attr('d', rsiLine)
  }, [candles, dimensions])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} />
    </div>
  )
}
