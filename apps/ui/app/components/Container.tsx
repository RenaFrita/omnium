'use client'

import { useState } from 'react'
import { useWorker } from '../hooks/useWorker'
import { Chart } from './Chart'
import { intervals } from '../constants'
import type { Interval } from '../types'

interface Props {
  coin: string
}

export const Container = ({ coin }: Props) => {
  const [interval, setInterval] = useState<Interval>('5m')
  useWorker(coin, interval)

  return (
    <section className="relative h-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden">
      {/* Barra Superior */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm tracking-wider">{coin.toUpperCase()}</span>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-emerald-400">LIVE</span>
          </div>
        </div>

        {/* Selector de Timeframe */}
        <div className="flex gap-1">
          {intervals.map((int) => (
            <button
              key={int}
              onClick={() => setInterval(int as Interval)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded border transition-all ${
                interval === int
                  ? 'bg-blue-600 border-blue-400 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {int}
            </button>
          ))}
        </div>
      </header>

      {/* Gráfico */}
      <main className="flex-1 p-3 min-h-0">
        <Chart interval={interval} />
      </main>
    </section>
  )
}
