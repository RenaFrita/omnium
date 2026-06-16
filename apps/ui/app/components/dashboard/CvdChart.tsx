'use client'

import { useShallow } from 'zustand/shallow'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useOrderFlowStore } from '../../stores/orderflow'
import { fmtK, Tip } from './utils'

export const CvdChart = () => {
  const { cvd, cvdData } = useOrderFlowStore(
    useShallow((s) => ({ cvd: s.cvd, cvdData: s.cvdData }))
  )
  const cvdColor = cvd >= 0 ? '#00ff88' : '#ff3366'

  return (
    <div className="bg-[#0d1526] border border-slate-800 rounded-md px-3 py-2.5">
      <div className="flex justify-between items-center text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-2">
        <span>CVD {'\u00b7'} Cumulative Volume Delta</span>
        <span className={`font-mono font-semibold text-[14px] ${cvd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {cvd >= 0 ? '\u25b2 ' : '\u25bc '}${fmtK(Math.abs(cvd))}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={90}>
        <AreaChart data={cvdData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={cvdColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={cvdColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="t" tick={false} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#4a6080', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={fmtK} width={40} />
          <Tooltip content={<Tip />} />
          <ReferenceLine y={0} stroke="#1a2a3a" />
          <Area type="monotone" dataKey="cvd" stroke={cvdColor} strokeWidth={1.5} fill="url(#cg)" dot={false} name="CVD" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
