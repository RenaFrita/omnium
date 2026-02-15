'use client'
import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { useChartDimensions } from '../hooks/useChartDimensions'
import { useChartStore } from '../stores/chart'
import { CandleUI, Interval } from '../types'
import { Rsi } from './Rsi'
import { Volume } from './Volume'
import { Candles } from './Candles'
import * as d3 from 'd3'
import { Activity, BarChart3, TrendingUp, Volume2, VolumeX } from 'lucide-react'

interface Props {
  interval: Interval
}

export const Chart = ({ interval }: Props) => {
  const [hoverData, setHoverData] = useState<{
    candle: CandleUI
    x: number
  } | null>(null)
  const [count, setCount] = useState(120)

  // Estados de Visibilidade e Som
  const [showVolume, setShowVolume] = useState(true)
  const [showRsi, setShowRsi] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const [indicators, setIndicators] = useState({
    ema20: true,
    ema50: true,
    ema100: true,
    ema200: true,
  })

  const containerRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastSignalRef = useRef<number | null>(null) // Para evitar sons repetidos na mesma candle

  const candles = useChartStore((state) => state.candles[interval])
  const { width, height } = useChartDimensions(containerRef)

  // 1. Inicializar áudio (Client Side)
  useEffect(() => {
    audioRef.current = new Audio('/long.mp3') // Caminho na pasta public
  }, [])

  // 2. Monitorizar Sinais (BOS/CHOCH) na última vela
  useEffect(() => {
    if (!isAudioEnabled || candles.length === 0) return

    const lastCandle = candles[candles.length - 1]
    const hasSignal = lastCandle.bos || lastCandle.choch

    // Só toca se houver sinal e se ainda não tocámos para este timestamp específico
    if (hasSignal && lastSignalRef.current !== lastCandle.t) {
      audioRef.current
        ?.play()
        .catch((e) => console.log('Erro ao tocar áudio:', e))
      lastSignalRef.current = lastCandle.t
    }
  }, [candles, isAudioEnabled])

  const { visible, stats } = useMemo(() => {
    const sliced = candles.slice(-count)
    if (sliced.length === 0) return { visible: [], stats: { min: 0, max: 0 } }
    const min = d3.min(sliced, (d) => d.l) || 0
    const max = d3.max(sliced, (d) => d.h) || 0
    return { visible: sliced, stats: { min, max } }
  }, [candles, count])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current || !visible.length) return
      const rect = containerRef.current.getBoundingClientRect()
      const margin = { left: 60, right: 50 }
      const innerWidth = width - margin.left - margin.right
      const mouseX = e.clientX - rect.left - margin.left
      if (mouseX < 0 || mouseX > innerWidth) {
        setHoverData(null)
        return
      }

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
      const bisect = d3.bisector((d: CandleUI) => d.t).center
      const index = bisect(visible, hoveredDate.getTime())
      const candle = visible[index]

      if (candle) {
        setHoverData({ candle, x: x(new Date(candle.t)) + margin.left })
      }
    },
    [visible, width]
  )

  const toggleEma = (key: keyof typeof indicators) => {
    setIndicators((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div
      className="flex flex-col w-full h-full bg-slate-900 select-none relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverData(null)}
    >
      {/* Tooltip Card (Mantido do anterior) */}
      {hoverData && (
        <>
          <div
            className="absolute top-0 bottom-0 w-[1px] bg-slate-500/30 pointer-events-none z-10"
            style={{ left: hoverData.x }}
          />
          <div
            className="absolute z-30 pointer-events-none"
            style={{
              left:
                hoverData.x > width - 200
                  ? hoverData.x - 190
                  : hoverData.x + 10,
              top: '10%',
            }}
          >
            <div className="bg-slate-950/90 backdrop-blur-md border border-slate-700 p-2 rounded shadow-2xl text-[10px] min-w-[120px]">
              <div className="text-slate-500 border-b border-slate-800 pb-1 mb-1 font-mono">
                {new Date(hoverData.candle.t).toLocaleTimeString()}
              </div>
              <div className="flex justify-between">
                <span>O:</span>
                <span className="text-white font-bold">
                  {hoverData.candle.o}
                </span>
              </div>
              <div className="flex justify-between">
                <span>H:</span>
                <span className="text-emerald-400 font-bold">
                  {hoverData.candle.h}
                </span>
              </div>
              <div className="flex justify-between">
                <span>L:</span>
                <span className="text-rose-400 font-bold">
                  {hoverData.candle.l}
                </span>
              </div>
              <div className="flex justify-between">
                <span>C:</span>
                <span className="text-white font-bold">
                  {hoverData.candle.c}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Área Gráfica */}
      <div
        ref={containerRef}
        className="flex flex-col flex-1 w-full min-h-0 relative"
      >
        <div
          className={`${showVolume || showRsi ? 'flex-[3]' : 'flex-1'} min-h-0`}
        >
          <Candles
            candles={visible}
            width={width}
            height={
              showVolume && showRsi
                ? height * 0.6
                : showVolume || showRsi
                  ? height * 0.8
                  : height
            }
            hoverX={hoverData ? hoverData.x - 60 : undefined}
            indicators={indicators}
          />
        </div>
        {showVolume && (
          <div className="flex-1 border-t border-slate-800/50 min-h-0">
            <Volume
              candles={visible}
              width={width}
              height={height * 0.2}
              hoverX={hoverData ? hoverData.x - 60 : undefined}
            />
          </div>
        )}
        {showRsi && (
          <div className="flex-1 border-t border-slate-800/50 min-h-0">
            <Rsi
              candles={visible}
              width={width}
              height={height * 0.2}
              hoverX={hoverData ? hoverData.x - 60 : undefined}
            />
          </div>
        )}
      </div>

      {/* Toolbar Inferior */}
      <div className="bg-slate-950 border-t border-slate-800 p-2 flex items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-1">
          {/* Botão de Som */}
          <button
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={`p-1.5 rounded transition-colors ${isAudioEnabled ? 'text-yellow-400 bg-yellow-400/10' : 'text-slate-600'}`}
            title={isAudioEnabled ? 'Alertas Ativos' : 'Alertas Mudos'}
          >
            {isAudioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <div className="h-4 w-[1px] bg-slate-800 mx-1" />

          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`p-1.5 rounded ${showVolume ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-600'}`}
          >
            <BarChart3 size={16} />
          </button>
          <button
            onClick={() => setShowRsi(!showRsi)}
            className={`p-1.5 rounded ${showRsi ? 'text-blue-400 bg-blue-400/10' : 'text-slate-600'}`}
          >
            <Activity size={16} />
          </button>

          <div className="h-4 w-[1px] bg-slate-800 mx-1" />
          {(['20', '50', '100', '200'] as const).map((ema) => (
            <button
              key={ema}
              onClick={() => toggleEma(`ema${ema}` as keyof typeof indicators)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${indicators[`ema${ema}` as keyof typeof indicators] ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-slate-900 border-slate-800 text-slate-600'}`}
            >
              EMA {ema}
            </button>
          ))}

          <div className="pointer-events-none bg-slate-950/40 p-1 px-3 rounded-full border border-slate-800 text-[10px] text-slate-500">
            MIN:{' '}
            <span className="text-rose-400 mr-2">{stats.min.toFixed(2)}</span>
            MAX:{' '}
            <span className="text-emerald-400">{stats.max.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-1 max-w-xs">
          <TrendingUp size={14} className="text-slate-500" />
          <input
            type="range"
            min="60"
            max="2000"
            step="10"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-[10px] font-mono text-slate-500 w-8">
            {count}
          </span>
        </div>
      </div>
    </div>
  )
}
