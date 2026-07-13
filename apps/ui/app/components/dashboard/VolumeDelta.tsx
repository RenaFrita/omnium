'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import * as d3 from 'd3'
import { useOrderFlowStore } from '../../stores/orderflow'
import { fmtK } from './utils'

export const VolumeDelta = () => {
  const cvdData = useOrderFlowStore((s) => s.cvdData)
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const height = 90

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const margin = { top: 4, right: 40, bottom: 4, left: 4 }
  const innerWidth = Math.max(0, width - margin.left - margin.right)
  const innerHeight = Math.max(0, height - margin.top - margin.bottom)

  const bars = useMemo(() => {
    if (!cvdData.length || innerWidth <= 0 || innerHeight <= 0) return null

    const values = cvdData.map((d) => d.cvd)
    const absMax = Math.max(Math.max(...values.map(Math.abs)), 1)

    const x = d3
      .scaleLinear()
      .domain([0, cvdData.length - 1])
      .range([0, innerWidth])

    const y = d3
      .scaleLinear()
      .domain([-absMax * 1.15, absMax * 1.15])
      .range([innerHeight, 0])

    const barWidth = Math.max(1, innerWidth / cvdData.length * 0.8)

    return {
      x,
      y,
      barWidth,
      yTicks: y.ticks(4),
      rects: cvdData.map((d, i) => ({
        x: x(i) - barWidth / 2,
        y: d.cvd >= 0 ? y(d.cvd) : y(0),
        height: Math.max(1, Math.abs(y(d.cvd) - y(0))),
        fill: d.cvd >= 0 ? '#00ff88' : '#ff3366',
      })),
    }
  }, [cvdData, innerWidth, innerHeight])

  return (
    <div className="bg-[#0d1526] border border-slate-800 rounded-md px-3 py-2.5">
      <div className="text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-2">
        Volume Delta {'\u00b7'} trades
      </div>
      <div ref={containerRef} style={{ width: '100%', height }}>
        {bars && width > 0 && (
          <svg width={width} height={height} style={{ display: 'block' }}>
            <g transform={`translate(${margin.left},${margin.top})`}>
              <line
                x1={0}
                x2={innerWidth}
                y1={bars.y(0)}
                y2={bars.y(0)}
                stroke="#1a2a3a"
              />
              {bars.rects.map((rect, i) => (
                <rect
                  key={i}
                  x={rect.x}
                  y={rect.y}
                  width={bars.barWidth}
                  height={rect.height}
                  fill={rect.fill}
                  opacity={0.85}
                  shapeRendering="crispEdges"
                />
              ))}
              <g fontSize="9" fill="#4a6080" textAnchor="start">
                {bars.yTicks.map((tick) => (
                  <text
                    key={tick.toString()}
                    x={innerWidth + 4}
                    y={bars.y(tick) + 3}
                  >
                    {fmtK(tick)}
                  </text>
                ))}
              </g>
            </g>
          </svg>
        )}
      </div>
    </div>
  )
}
