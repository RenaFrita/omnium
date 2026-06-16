'use client'

import { useShallow } from 'zustand/shallow'
import { useOrderFlowStore } from '../../stores/orderflow'
import { fmtK } from './utils'

export const BookImbalanceCard = () => {
  const { bookImb, bidDepth, askDepth } = useOrderFlowStore(
    useShallow((s) => ({ bookImb: s.bookImb, bidDepth: s.bidDepth, askDepth: s.askDepth }))
  )
  const bookImbClr = bookImb > 0 ? '#00ff88' : bookImb < 0 ? '#ff3366' : '#4a6080'

  return (
    <div className="bg-[#0d1526] border border-slate-800 rounded-md px-3 py-2.5">
      <div className="text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-2">Book Imbalance</div>
      <div className="text-[22px] font-bold font-mono leading-none" style={{ color: bookImbClr }}>{(bookImb * 100).toFixed(1)}%</div>
      <div className="text-[10px] text-slate-500 mt-0.5">
        {bookImb > 0.1 ? '\u25b2 BID heavy' : bookImb < -0.1 ? '\u25bc ASK heavy' : '\u2248 Balanced'}
      </div>
      <div className="flex h-1.5 rounded overflow-hidden mt-1.5">
        <div style={{ flex: Math.max(0, 0.5 + bookImb / 2) }} className="bg-emerald-400" />
        <div style={{ flex: Math.max(0, 0.5 - bookImb / 2) }} className="bg-rose-400" />
      </div>
      <div className="h-px bg-slate-800 my-2" />
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-slate-500 font-mono">BID LIQ</span>
        <span className="font-mono font-semibold text-[11px] text-emerald-400">${fmtK(bidDepth)}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-slate-500 font-mono">ASK LIQ</span>
        <span className="font-mono font-semibold text-[11px] text-rose-400">${fmtK(askDepth)}</span>
      </div>
    </div>
  )
}
