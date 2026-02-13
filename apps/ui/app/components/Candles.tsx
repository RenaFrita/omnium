import { useEffect, useRef } from 'react'
import { ChartData } from '../stores/chart'
import * as d3 from 'd3'

interface Props {
  candles: ChartData[]
  width: number
  height: number
}

export const Candles = ({ candles, width, height }: Props) => {
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    const margin = { top: 20, right: 50, bottom: 30, left: 60 }
    const priceHeight = height - margin.bottom

    const innerWidth = width - margin.left - margin.right
    const innerPriceHeight = priceHeight - margin.top

    const svg = d3.select(svgRef.current)
    svg.attr('viewBox', `0 0 ${width} ${height}`)

    // ================= GROUPS =================

    let priceG = svg.select<SVGGElement>('.price-group')
    if (priceG.empty()) {
      priceG = svg.append('g').attr('class', 'price-group')
    }
    priceG.attr('transform', `translate(${margin.left},${margin.top})`)

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

    // -----------------------------
    // 3️⃣ BOS
    // -----------------------------
    priceG
      .selectAll<SVGCircleElement, ChartData>('.bos')
      .data(candles)
      .join('circle')
      .attr('class', 'bos')
      .attr('cx', (d) => x(new Date(d.t)))
      .attr('cy', (d) =>
        d.bos ? y(Math.max(d.o, d.c, d.h)) : -100
      )
      .attr('r', (d) => (d.bos ? 4 : 0))
      .attr('fill', (d) =>
        d.bos === 'bullish'
          ? 'green'
          : d.bos === 'bearish'
            ? 'red'
            : 'transparent'
      )

    // -----------------------------
    // 4️⃣ CHoCH
    // -----------------------------
    priceG
      .selectAll<SVGPolygonElement, ChartData>('.choch')
      .data(candles)
      .join('polygon')
      .attr('class', 'choch')
      .attr('points', (d) => {
        if (!d.choch) return ''
        const cx = x(new Date(d.t))
        const cy = y(Math.max(d.o, d.c, d.h))
        const size = 6
        return d.choch === 'bullish'
          ? `${cx},${cy - size} ${cx - size},${cy + size} ${cx + size},${cy + size}`
          : `${cx},${cy + size} ${cx - size},${cy - size} ${cx + size},${cy - size}`
      })
      .attr('fill', (d) =>
        d.choch === 'bullish'
          ? 'green'
          : d.choch === 'bearish'
            ? 'red'
            : 'transparent'
      )

    // // ================= EMA =================
    type EMAKey = keyof Pick<ChartData, 'ema20' | 'ema50' | 'ema100' | 'ema200'>
    const emaKeys: { key: EMAKey; color: string }[] = [
      { key: 'ema20', color: '#3b82f6' },
      { key: 'ema50', color: '#f59e0b' },
      { key: 'ema100', color: '#eca1a6' },
      { key: 'ema200', color: '#d6cbd3' },
    ]

    emaKeys.forEach(({ key, color }) => {
      const line = d3
        .line<ChartData>()
        .defined((d) => d[key] !== undefined && d[key] !== null)
        .x((d) => x(new Date(d.t)))
        .y((d) => y(d[key]!))

      priceG
        .selectAll<SVGPathElement, ChartData[]>(`.${key}`)
        .data([candles])
        .join('path')
        .attr('class', key)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1.5)
        .attr('d', line)
    })
  }, [candles, width, height])
  return <svg ref={svgRef} />
}
