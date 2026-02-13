'use client'
import { useMemo, useRef, useState } from 'react'
import { useChartDimensions } from '../hooks/useChartDimensions'
import { useChartStore } from '../stores/chart'
import { Interval } from '../types'
import { Candles } from './Candles'
import { Rsi } from './Rsi'

interface Props {
  interval: Interval
}

export const Chart = ({ interval }: Props) => {
  const [count, setCount] = useState(100)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const candles = useChartStore((state) => state[interval])
  const { width, height } = useChartDimensions(containerRef)
  const visible = useMemo(() => {
    return candles.slice(-count)
  }, [candles, count])

  return (
    <div style={{ display: 'flex', flexDirection: "column", width: '100%', height: '100%' }}>
      <div style={{ display: 'flex', gap: 10, padding: 8 }}>
        {[50, 100, 200, 400, 600].map((n) => (
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
      <div ref={containerRef} style={{ flex: 1 }}>
        <Candles candles={visible} width={width} height={height * 0.8} />
        {/* <VolumeChart candles={candles} width={width} height={height * 0.3} /> */}
        <Rsi candles={visible} width={width} height={height * 0.2} />
      </div>
    </div>
  )
}
