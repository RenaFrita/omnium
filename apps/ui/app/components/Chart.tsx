'use client'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useChartDimensions } from '../hooks/useChartDimensions'
import { useChartStore } from '../stores/chart'
import { CandleUI, Interval } from '../types'
import { Rsi } from './Rsi'
import { Volume } from './Volume'
import { Candles } from './Candles'
import * as d3 from 'd3'

interface Props {
  interval: Interval
}

export const Chart = ({ interval }: Props) => {
  const [hoverData, setHoverData] = useState<{
    candle: CandleUI
    x: number
  } | null>(null)
  const [count, setCount] = useState(60)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const candles = useChartStore((state) => state.candles[interval])
  const { width, height } = useChartDimensions(containerRef)
  const visible = useMemo(() => {
    return candles.slice(-count)
  }, [candles, count])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current || !visible.length) return

      const rect = containerRef.current.getBoundingClientRect()
      const margin = { left: 60, right: 50 }
      const innerWidth = width - margin.left - margin.right

      // 1. MouseX relativo à área de desenho (innerWidth)
      const mouseX = e.clientX - rect.left - margin.left

      if (mouseX < 0 || mouseX > innerWidth) {
        setHoverData(null)
        return
      }

      // 2. Escala idêntica aos componentes (com o offset de meio step)
      const timeExtent = d3.extent(visible, (d) => d.t) as [number, number]
      const step = visible.length > 1 ? visible[1].t - visible[0].t : 60_000

      const x = d3
        .scaleTime()
        .domain([
          new Date(timeExtent[0] - step / 2),
          new Date(timeExtent[1] + step / 2),
        ])
        .range([0, innerWidth])

      const hoveredDate = x.invert(mouseX)

      // 3. Encontrar a vela e centralizar o X no timestamp exato da vela
      const bisect = d3.bisector((d: CandleUI) => d.t).center // .center é melhor que .left para crosshair
      const index = bisect(visible, hoveredDate.getTime())
      const candle = visible[index]

      if (!candle) return

      // Passamos o X relativo (sem margem) para os filhos
      setHoverData({
        candle,
        x: x(new Date(candle.t)),
      })
    },
    [visible, width]
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverData(null)}
    >
      <div
        ref={containerRef}
        style={{ flex: 1, maxHeight: 'calc(100% - 40px)' }}
      >
        <Candles
          candles={visible}
          width={width}
          height={height * 0.6}
          hoverX={hoverData?.x}
        />
        <Volume
          candles={visible}
          width={width}
          height={height * 0.2}
          hoverX={hoverData?.x}
        />
        <Rsi
          candles={visible}
          width={width}
          height={height * 0.2}
          hoverX={hoverData?.x}
        />
      </div>
      <div style={{ display: 'flex', gap: 10, padding: 8, flex: 0 }}>
        {[60, 120, 240, 480, 960].map((n) => (
          <label key={n} style={{ cursor: 'pointer' }}>
            <input
              type="radio"
              name={`${interval}-count`}
              value={n}
              checked={count === n}
              onChange={() => setCount(n)}
            />
            {n}
          </label>
        ))}
      </div>
      {hoverData && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 70,
            background: 'rgba(0,0,0,0.8)',
            padding: '4px 8px',
            fontSize: '12px',
            color: 'white',
            pointerEvents: 'none',
            borderRadius: '4px',
          }}
        >
          O: {hoverData.candle.o} H: {hoverData.candle.h} L:{' '}
          {hoverData.candle.l} C: {hoverData.candle.c}
        </div>
      )}
    </div>
  )
}
