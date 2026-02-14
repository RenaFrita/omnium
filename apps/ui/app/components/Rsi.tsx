import { useMemo } from 'react'
import { CandleUI } from '../types'
import * as d3 from 'd3'

interface Props {
  width: number
  height: number
  candles: CandleUI[]
  hoverX?: number
}

export const Rsi = ({ width, height, candles, hoverX }: Props) => {
  const margin = useMemo(
    () => ({ top: 10, right: 50, bottom: 20, left: 60 }),
    []
  )
  const innerWidth = Math.max(0, width - margin.left - margin.right)
  const innerHeight = Math.max(0, height - margin.top - margin.bottom)

  const { pathData, x, y } = useMemo(() => {
    if (!candles.length || innerWidth <= 0 || innerHeight <= 0) {
      return { pathData: null, x: null, y: null }
    }

    const timeExtent = d3.extent(candles, (d) => d.t) as [number, number]
    const step = candles.length > 1 ? candles[1].t - candles[0].t : 60_000

    const xScale = d3
      .scaleTime()
      .domain([
        new Date(timeExtent[0] - step / 2),
        new Date(timeExtent[1] + step / 2),
      ])
      .range([0, innerWidth])

    const yScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0])

    const lineGenerator = d3
      .line<CandleUI>()
      .defined((d) => d.rsi !== undefined && !isNaN(d.rsi))
      .x((d) => xScale(new Date(d.t)))
      .y((d) => yScale(d.rsi as number))
      .curve(d3.curveMonotoneX)

    return {
      pathData: lineGenerator(candles),
      x: xScale,
      y: yScale,
    }
  }, [candles, innerWidth, innerHeight])

  if (!x || !y || width <= 0 || height <= 0) return null

  return (
    <div style={{ width: '100%', height: '20%', contain: 'strict' }}>
      <svg width={width} height={height} style={{ display: 'block' }}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          <line
            x1={0}
            x2={innerWidth}
            y1={y(70)}
            y2={y(70)}
            stroke="#333"
            strokeDasharray="4,4"
          />
          <line
            x1={0}
            x2={innerWidth}
            y1={y(30)}
            y2={y(30)}
            stroke="#333"
            strokeDasharray="4,4"
          />
          <line
            x1={0}
            x2={innerWidth}
            y1={y(50)}
            y2={y(50)}
            stroke="#222"
            strokeOpacity="0.5"
          />
          <g fontSize="9" fill="#666" textAnchor="end">
            {[30, 50, 70].map((tick) => (
              <text key={tick} x="-5" y={y(tick) + 3}>
                {tick}
              </text>
            ))}
          </g>
          {pathData && (
            <path
              d={pathData}
              fill="none"
              stroke="#a855f7"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          {hoverX !== undefined && (
            <line
              x1={hoverX} // hoverX já é o x(candle.t) vindo do pai
              x2={hoverX}
              y1={0}
              y2={innerHeight}
              stroke="#ffffff"
              strokeWidth={1}
              strokeDasharray="4,4"
              style={{ opacity: 0.5, pointerEvents: 'none' }}
            />
          )}
        </g>
      </svg>
    </div>
  )
}
