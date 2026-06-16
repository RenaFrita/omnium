'use client'

import { useState } from 'react'
import { useOrderFlowStore } from '../../stores/orderflow'
import { fmt, fmtK } from './utils'

interface Props {
  sendToWorker: (msg: Record<string, unknown>) => void
}

export const LargePrints = ({ sendToWorker }: Props) => {
  const largePrints = useOrderFlowStore((s) => s.largePrints)
  const lpThreshold = useOrderFlowStore((s) => s.largePrintThreshold)
  const [multiplier, setMultiplier] = useState(5)

  return (
    <div className="bg-[#0d1526] border border-slate-800 rounded-md px-3 py-2.5">
      <div className="flex justify-between items-center text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-2">
        <span>Large Prints {lpThreshold > 0 && <span className="text-[9px] text-slate-600 font-mono">&gt; ${fmtK(lpThreshold)}</span>}</span>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-slate-500">mult</span>
          <input
            className="bg-[#0a0e1a] border border-slate-800 rounded text-[11px] text-cyan-400 px-1.5 py-0.5 w-[50px] font-mono outline-none"
            type="number"
            min={1}
            step={0.5}
            value={multiplier}
            onChange={(e) => {
              const v = Number(e.target.value)
              setMultiplier(v)
              sendToWorker({ type: 'SET_LARGE_PRINT_MULTIPLIER', value: v })
            }}
          />
        </div>
      </div>
      {largePrints.length === 0 ? (
        <div className="text-slate-700 text-[11px] font-mono">Aguardando...</div>
      ) : (
        largePrints.map((p, i) => (
          <div
            key={i}
            className={`flex justify-between items-center px-2 py-1 rounded mb-1 text-[11px] font-mono border-l-2 ${
              p.side === 'B' ? 'bg-emerald-500/3 border-emerald-400' : 'bg-rose-500/3 border-rose-400'
            }`}
          >
            <span className={`font-bold ${p.side === 'B' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {p.side === 'B' ? '\u25b2' : '\u25bc'} ${fmtK(p.usd)}
            </span>
            <span className="text-slate-500">{fmt(p.price)}</span>
            <span className="text-slate-600 text-[9px]">{p.t}</span>
          </div>
        ))
      )}
    </div>
  )
}
