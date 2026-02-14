import { useEffect, useRef } from 'react'
import { ChartData } from '../stores/chart'
import * as d3 from 'd3'

interface Props {
  width: number
  height: number
  candles: ChartData[]
}

export const Rsi = ({ width, height, candles }: Props) => {
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    const margin = { top: 10, right: 50, bottom: 10, left: 60 }
    const rsiHeight = height - margin.bottom

    const innerWidth = width - margin.left - margin.right
    const innerRsiHeight = rsiHeight - 20

    const svg = d3.select(svgRef.current)
    svg.attr('viewBox', `0 0 ${width} ${height}`)

    // ================= GROUPS =================
    let rsiG = svg.select<SVGGElement>('.rsi-group')
    if (rsiG.empty()) {
      rsiG = svg.append('g').attr('class', 'rsi-group')
    }
    rsiG.attr('transform', `translate(${margin.left},${margin.top})`)

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

    const rsiScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([innerRsiHeight, 0])

    // ================= AXES =================
    rsiG
      .selectAll<SVGGElement, null>('.rsi-axis')
      .data([null])
      .join('g')
      .attr('class', 'rsi-axis')
      .call(d3.axisLeft(rsiScale).tickValues([0, 50, 100]))

    // ================= RSI =================
    const rsiData = candles
      .map((c) => ({ t: c.t, value: c.rsi }))
      .filter((d): d is { t: number; value: number } => d.value !== undefined)

    const rsiLine = d3
      .line<{ t: number; value: number }>()
      .x((d) => x(new Date(d.t)))
      .y((d) => rsiScale(d.value as number))

    rsiG
      .selectAll<SVGPathElement, (typeof rsiData)[]>('.rsi-line')
      .data([rsiData])
      .join('path')
      .attr('class', 'rsi-line')
      .attr('fill', 'none')
      .attr('stroke', '#a855f7')
      .attr('stroke-width', 1.5)
      .attr('d', rsiLine)
  }, [candles, width, height])

  return <svg ref={svgRef} />
}
