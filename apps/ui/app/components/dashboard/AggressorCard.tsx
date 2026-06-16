'use client'

import { useShallow } from 'zustand/shallow'
import { useOrderFlowStore } from '../../stores/orderflow'

export const AggressorCard = () => {
  const { aggrRatio, aggrBuys, aggrSells, aggrTotal } = useOrderFlowStore(
    useShallow((s) => ({ aggrRatio: s.aggrRatio, aggrBuys: s.aggrBuys, aggrSells: s.aggrSells, aggrTotal: s.aggrTotal }))
  )

  return (
    <div className="bg-[#0d1526] border border-slate-800 rounded-md px-3 py-2.5">
      <div className="text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-2">Aggressor Ratio</div>
      <div className={`text-[22px] font-bold font-mono leading-none ${aggrRatio > 0.5 ? 'text-emerald-400' : 'text-rose-400'}`}>
        {(aggrRatio * 100).toFixed(1)}%
      </div>
      <div className="text-[10px] text-slate-500 mt-0.5">{aggrRatio >= 0.5 ? '\u25b2 BUY' : '\u25bc SELL'} dominated</div>
      <div className="flex h-1.5 rounded overflow-hidden mt-1.5">
        <div style={{ flex: aggrRatio }} className="bg-emerald-400" />
        <div style={{ flex: 1 - aggrRatio }} className="bg-rose-400" />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-emerald-400">B {aggrBuys}</span>
        <span className="text-[10px] text-rose-400">S {aggrSells}</span>
      </div>
      <div className="h-px bg-slate-800 my-2" />
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-slate-500 font-mono">TOTAL</span>
        <span className="font-mono font-semibold text-[12px] text-slate-300">{aggrTotal.toLocaleString()}</span>
      </div>
    </div>
  )
}
