'use client'

import { useShallow } from 'zustand/shallow'
import { useOrderFlowStore } from '../../stores/orderflow'
import { fmtK } from './utils'

export const TradeImbalance = () => {
  const { tradeRatio, buyVol60, sellVol60 } = useOrderFlowStore(
    useShallow((s) => ({ tradeRatio: s.tradeRatio, buyVol60: s.buyVol60, sellVol60: s.sellVol60 }))
  )

  return (
    <div className="bg-[#0d1526] border border-slate-800 rounded-md px-3 py-2.5">
      <div className="flex justify-between items-center text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-2">
        <span>Trade Imbalance {'\u00b7'} 60s</span>
        <span className={`font-mono font-semibold text-[12px] ${tradeRatio > 0.5 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {(tradeRatio * 100).toFixed(1)}% BUY
        </span>
      </div>
      <div className="flex gap-4 mb-2">
        <div>
          <div className="text-[22px] font-bold font-mono text-emerald-400 leading-none">${fmtK(buyVol60)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">BUY</div>
        </div>
        <div>
          <div className="text-[22px] font-bold font-mono text-rose-400 leading-none">${fmtK(sellVol60)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">SELL</div>
        </div>
      </div>
      <div className="flex h-1.5 rounded overflow-hidden">
        <div style={{ flex: tradeRatio }} className="bg-emerald-400 rounded-l" />
        <div style={{ flex: 1 - tradeRatio }} className="bg-rose-400 rounded-r" />
      </div>
    </div>
  )
}
