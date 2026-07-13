'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import * as d3 from 'd3'
import { useShallow } from 'zustand/shallow'
import { useOrderFlowStore } from '../../stores/orderflow'
import { fmtK } from './utils'

export const CvdChart = () => {
  const { cvd, cvdData } = useOrderFlowStore(
    useShallow((s) => ({ cvd: s.cvd, cvdData: s.cvdData }))
  )
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

  const scales = useMemo(() => {
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

    const area = d3
      .area<{ t: string; cvd: number }>()
      .x((_, i) => x(i))
      .y0(y(0))
      .y1((d) => y(d.cvd))
      .curve(d3.curveMonotoneX)

    const line = d3
      .line<{ t: string; cvd: number }>()
      .x((_, i) => x(i))
      .y((d) => y(d.cvd))
      .curve(d3.curveMonotoneX)

    return {
      x,
      y,
      areaPath: area(cvdData),
      linePath: line(cvdData),
      yTicks: y.ticks(4),
    }
  }, [cvdData, innerWidth, innerHeight])

  const cvdColor = cvd >= 0 ? '#00ff88' : '#ff3366'

  return (
    <div className="bg-[#0d1526] border border-slate-800 rounded-md px-3 py-2.5">
      <div className="flex justify-between items-center text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-2">
        <span>CVD {'\u00b7'} Cumulative Volume Delta</span>
        <span
          className={`font-mono font-semibold text-[14px] ${cvd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
        >
          {cvd >= 0 ? '\u25b2 ' : '\u25bc '}${fmtK(Math.abs(cvd))}
        </span>
      </div>
      <div ref={containerRef} style={{ width: '100%', height }}>
        {scales && width > 0 && (
          <svg width={width} height={height} style={{ display: 'block' }}>
            <defs>
              <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={cvdColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={cvdColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <g transform={`translate(${margin.left},${margin.top})`}>
              <line
                x1={0}
                x2={innerWidth}
                y1={scales.y(0)}
                y2={scales.y(0)}
                stroke="#1a2a3a"
              />
              <path d={scales.areaPath ?? ''} fill="url(#cg)" />
              <path
                d={scales.linePath ?? ''}
                fill="none"
                stroke={cvdColor}
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <g fontSize="9" fill="#4a6080" textAnchor="start">
                {scales.yTicks.map((tick) => (
                  <text
                    key={tick.toString()}
                    x={innerWidth + 4}
                    y={scales.y(tick) + 3}
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
