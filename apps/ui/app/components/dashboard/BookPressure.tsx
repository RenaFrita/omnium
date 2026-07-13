'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import * as d3 from 'd3'
import { useOrderFlowStore } from '../../stores/orderflow'

export const BookPressure = () => {
  const pressureData = useOrderFlowStore((s) => s.pressureData)
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const height = 65

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const margin = { top: 2, right: 4, bottom: 2, left: 4 }
  const innerWidth = Math.max(0, width - margin.left - margin.right)
  const innerHeight = Math.max(0, height - margin.top - margin.bottom)

  const linePath = useMemo(() => {
    if (!pressureData.length || innerWidth <= 0 || innerHeight <= 0) return null

    const x = d3
      .scaleLinear()
      .domain([0, pressureData.length - 1])
      .range([0, innerWidth])

    const y = d3.scaleLinear().domain([-100, 100]).range([innerHeight, 0])

    const line = d3
      .line<{ t: string; imbalance: number }>()
      .x((_, i) => x(i))
      .y((d) => y(d.imbalance))
      .curve(d3.curveMonotoneX)

    return line(pressureData)
  }, [pressureData, innerWidth, innerHeight])

  return (
    <div className="bg-[#0d1526] border border-slate-800 rounded-md px-3 py-2.5">
      <div className="text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-2">
        Book Pressure
      </div>
      <div ref={containerRef} style={{ width: '100%', height }}>
        {linePath && width > 0 && (
          <svg width={width} height={height} style={{ display: 'block' }}>
            <g transform={`translate(${margin.left},${margin.top})`}>
              <line
                x1={0}
                x2={innerWidth}
                y1={innerHeight / 2}
                y2={innerHeight / 2}
                stroke="#1a2a3a"
              />
              <path
                d={linePath}
                fill="none"
                stroke="#00d4ff"
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </g>
          </svg>
        )}
      </div>
    </div>
  )
}
