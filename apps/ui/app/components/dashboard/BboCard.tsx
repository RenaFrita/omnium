'use client'

import { useShallow } from 'zustand/shallow'
import { useOrderBookStore } from '../../stores/orderbook'
import { useOrderFlowStore } from '../../stores/orderflow'
import { fmt } from './utils'

export const BboCard = () => {
  const { bids, asks } = useOrderBookStore(useShallow((s) => ({ bids: s.bids, asks: s.asks })))
  const vwap = useOrderFlowStore((s) => s.vwap)

  const bid = bids.length > 0 ? bids[0].price : null
  const ask = asks.length > 0 ? asks[0].price : null
  const spread = bid != null && ask != null ? ask - bid : null
  const mid = bid != null && ask != null ? (bid + ask) / 2 : null

  return (
    <div className="bg-[#0d1526] border border-slate-800 rounded-md px-3 py-2.5">
      <div className="text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-2">BBO {'\u00b7'} Best Bid / Offer</div>
      <div className="flex justify-between">
        <div>
          <div className="text-[22px] font-bold font-mono text-emerald-400 leading-none">{fmt(bid)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">BID</div>
        </div>
        <div className="text-center">
          <div className="text-[22px] font-bold font-mono text-slate-500 leading-none">{spread != null ? spread.toFixed(1) : '\u2014'}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">SPREAD</div>
        </div>
        <div className="text-right">
          <div className="text-[22px] font-bold font-mono text-rose-400 leading-none">{fmt(ask)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">ASK</div>
        </div>
      </div>
      <div className="h-px bg-slate-800 my-2" />
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-slate-500 font-mono">MID</span>
        <span className="font-mono font-semibold text-[12px] text-cyan-400">{fmt(mid)}</span>
      </div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-slate-500 font-mono">VWAP</span>
        <span className="font-mono font-semibold text-[12px] text-slate-300">{vwap ? fmt(vwap) : '\u2014'}</span>
      </div>
      {mid && vwap && (
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-slate-500 font-mono">MID vs VWAP</span>
          <span className={`font-mono font-semibold text-[11px] ${mid > vwap ? 'text-emerald-400' : 'text-rose-400'}`}>
            {mid > vwap ? '\u25b2' : '\u25bc'} {Math.abs(mid - vwap).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  )
}
