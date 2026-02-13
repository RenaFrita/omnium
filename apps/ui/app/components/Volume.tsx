import { useEffect, useRef } from 'react'
import { ChartData } from '../stores/chart'
import * as d3 from 'd3'

interface Props {
  width: number
  height: number
  candles: ChartData[]
}

export const VolumeChart = ({ width, height, candles }: Props) => {
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    if (!candles.length) return

    // ================= MARGENS =================
    const margin = { top: 10, right: 50, bottom: 30, left: 60 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    // ================= SVG =================
    const svg = d3.select(svgRef.current)
    svg.attr('viewBox', `0 0 ${width} ${height}`)

    // ================= GRUPO =================
    let volumeG = svg.select<SVGGElement>('.volume-group')
    if (volumeG.empty()) {
      volumeG = svg.append('g').attr('class', 'volume-group')
    }
    volumeG.attr('transform', `translate(${margin.left},${margin.top})`)

    // ================= ESCALAS =================
    const timeExtent = d3.extent(candles, (d) => d.t) as [number, number]
    const step = candles.length > 1 ? candles[1].t - candles[0].t : 60_000

    const x = d3
      .scaleTime()
      .domain([
        new Date(timeExtent[0] - step / 2),
        new Date(timeExtent[1] + step / 2),
      ])
      .range([0, innerWidth])

    const volMax = d3.max(candles, (d) => d.v)!
    const y = d3.scaleLinear().domain([0, volMax]).range([innerHeight, 0]) // 0 (min volume) fica no fundo, max no topo

    // ================= EIXOS =================
    volumeG
      .selectAll<SVGGElement, null>('.x-axis')
      .data([null])
      .join('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(Math.min(candles.length, 6)))

    volumeG
      .selectAll<SVGGElement, null>('.y-axis')
      .data([null])
      .join('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y).ticks(4))

    // ================= BARRAS =================
    const barWidth = Math.max(1, (innerWidth / candles.length) * 0.8)

    volumeG
      .selectAll<SVGRectElement, ChartData>('.vol-bar')
      .data(candles)
      .join('rect')
      .attr('class', 'vol-bar')
      .attr('x', (d) => x(new Date(d.t)) - barWidth / 2)
      .attr('width', barWidth)
      .attr('y', (d) => y(d.v)) // topo da barra
      .attr('height', (d) => y(0) - y(d.v)) // altura correta
      .attr('fill', (d) =>
        d.volumeSpike ? '#facc15' : d.c >= d.o ? '#16a34a' : '#dc2626'
      )

    // ================= DEBUG =================
  }, [candles, width, height])

  return <svg ref={svgRef} />
}
