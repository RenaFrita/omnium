'use client'

import { useState, useEffect } from 'react'
import { useOrderFlowStore } from '../../stores/orderflow'
import { fmtK } from './utils'

const ALERT_COOLDOWN_MS = 300000
const ALERT_BOOK_IMB_MIN = 0.25
const ALERT_TRADE_IMB_MIN = 0.68
const ALERT_AGGRESSOR_MIN = 0.7

interface AlertData {
  dir: string
  ts: number
  coin: string
  cvd: number
  bookImb: number
  tradeRatio: number
  aggrRatio: number
}

interface Props {
  activeAlert: AlertData | null
  setActiveAlert: (v: AlertData | null) => void
  alertHistory: AlertData[]
}

export const AlertSection = ({ activeAlert, setActiveAlert, alertHistory }: Props) => {
  const cvd = useOrderFlowStore((s) => s.cvd)
  const bookImb = useOrderFlowStore((s) => s.bookImb)
  const tradeRatio = useOrderFlowStore((s) => s.tradeRatio)
  const aggrRatio = useOrderFlowStore((s) => s.aggrRatio)
  const lastAlert = useOrderFlowStore((s) => s.lastAlert)
  const cvdThreshold = useOrderFlowStore((s) => s.cvdThreshold)

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const isLongMode = cvd >= 0
  const cooldownSec = Math.max(0, Math.ceil((ALERT_COOLDOWN_MS - (now - lastAlert)) / 1000))
  const inCooldown = cooldownSec > 0 && lastAlert > 0

  const conditions = [
    {
      label: 'CVD',
      value: '$' + fmtK(cvd),
      met: cvdThreshold > 0 ? (isLongMode ? cvd > cvdThreshold : cvd < -cvdThreshold) : false,
      desc: cvdThreshold > 0
        ? (isLongMode ? `> $${fmtK(cvdThreshold)}` : `< -$${fmtK(cvdThreshold)}`)
        : 'aguardando...',
    },
    {
      label: 'Book Imb',
      value: (bookImb * 100).toFixed(1) + '%',
      met: isLongMode ? bookImb > ALERT_BOOK_IMB_MIN : bookImb < -ALERT_BOOK_IMB_MIN,
      desc: isLongMode ? `bid > ${(ALERT_BOOK_IMB_MIN * 100).toFixed(0)}%` : `ask > ${(ALERT_BOOK_IMB_MIN * 100).toFixed(0)}%`,
    },
    {
      label: 'Trade Imb',
      value: (tradeRatio * 100).toFixed(1) + '%',
      met: isLongMode ? tradeRatio > ALERT_TRADE_IMB_MIN : tradeRatio < 1 - ALERT_TRADE_IMB_MIN,
      desc: isLongMode ? `buy > ${(ALERT_TRADE_IMB_MIN * 100).toFixed(0)}%` : `sell > ${((1 - ALERT_TRADE_IMB_MIN) * 100).toFixed(0)}%`,
    },
    {
      label: 'Aggressor',
      value: (aggrRatio * 100).toFixed(1) + '%',
      met: isLongMode ? aggrRatio > ALERT_AGGRESSOR_MIN : aggrRatio < 1 - ALERT_AGGRESSOR_MIN,
      desc: isLongMode ? `buy > ${(ALERT_AGGRESSOR_MIN * 100).toFixed(0)}%` : `sell > ${((1 - ALERT_AGGRESSOR_MIN) * 100).toFixed(0)}%`,
    },
  ]
  const metCount = conditions.filter((c) => c.met).length

  return (
    <>
      {activeAlert && (
        <div
          className={`flex items-center justify-between px-4 py-3 rounded-md border ${
            activeAlert.dir === 'LONG' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-rose-500/10 border-rose-500'
          }`}
        >
          <div>
            <div className={`text-base font-extrabold font-mono tracking-wider ${activeAlert.dir === 'LONG' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {activeAlert.dir === 'LONG' ? '\u25b2 LONG SETUP' : '\u25bc SHORT SETUP'} {'\u00b7'} {activeAlert.coin}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                4/4 alinhadas {'\u00b7'} CVD ${fmtK(activeAlert.cvd)} {'\u00b7'} book {(activeAlert.bookImb * 100).toFixed(1)}%
              </div>
          </div>
          <button onClick={() => setActiveAlert(null)} className="text-slate-500 hover:text-slate-300 text-base bg-transparent border-none cursor-pointer">
            {'\u2715'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <div className={`bg-[#0d1526] border rounded-md px-3 py-2.5 ${
          metCount === 4
            ? isLongMode ? 'border-emerald-500' : 'border-rose-500'
            : 'border-slate-800'
        }`}>
          <div className="flex justify-between items-center text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-2">
            <span>Signal Conditions {'\u00b7'} {isLongMode ? '\u25b2 LONG' : '\u25bc SHORT'}</span>
            <span className={`font-bold ${
              metCount === 4
                ? isLongMode ? 'text-emerald-400' : 'text-rose-400'
                : 'text-slate-500'
            }`}>
              {metCount}/4
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {conditions.map((c) => (
              <div key={c.label} className={`flex items-center gap-1.5 py-0.5 ${c.met ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  c.met
                    ? isLongMode ? 'bg-emerald-400 shadow-[0_0_5px_rgba(0,255,136,0.5)]' : 'bg-rose-400 shadow-[0_0_5px_rgba(255,51,102,0.5)]'
                    : 'bg-slate-800'
                }`} />
                <div>
                  <div className={`text-[11px] font-mono ${c.met ? (isLongMode ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-300'}`}>
                    {c.label} <b>{c.value}</b>
                  </div>
                  <div className="text-[9px] text-slate-500">{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-0.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-sm ${
                  i < metCount
                    ? isLongMode ? 'bg-emerald-400' : 'bg-rose-400'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
          {inCooldown && (
            <div className="mt-1 text-[9px] text-slate-500">
              proximo em {cooldownSec}s
              <div className="h-0.5 bg-slate-800 rounded mt-0.5">
                <div
                  className="h-full bg-slate-600 rounded"
                  style={{ width: `${(cooldownSec / (ALERT_COOLDOWN_MS / 1000)) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#0d1526] border border-slate-800 rounded-md px-3 py-2.5">
          <div className="flex justify-between items-center text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-2">
            <span>Alert History</span>
            <span className="text-slate-700">{alertHistory.length}</span>
          </div>
          {alertHistory.length === 0 ? (
            <div className="text-slate-700 text-[10px] font-mono">Sem alertas...</div>
          ) : (
            alertHistory.map((a, i) => (
              <div
                key={i}
                className={`flex justify-between items-center px-2 py-1 rounded mb-0.5 text-[10px] font-mono border-l-2 ${
                  a.dir === 'LONG' ? 'bg-emerald-500/3 border-emerald-400' : 'bg-rose-500/3 border-rose-400'
                }`}
              >
                <span className={`font-bold ${a.dir === 'LONG' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {a.dir === 'LONG' ? '\u25b2' : '\u25bc'} {a.dir}
                </span>
                <span className="text-slate-500">{a.coin}</span>
                <span className="text-slate-600 text-[9px]">{new Date(a.ts).toLocaleTimeString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
