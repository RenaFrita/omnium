'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import { useOrderFlowStore } from '../../stores/orderflow'
import { fmtK, Tip } from './utils'

export const VolumeDelta = () => {
  const cvdData = useOrderFlowStore((s) => s.cvdData)

  return (
    <div className="bg-[#0d1526] border border-slate-800 rounded-md px-3 py-2.5">
      <div className="text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-2">Volume Delta {'\u00b7'} trades</div>
      <ResponsiveContainer width="100%" height={90}>
        <BarChart data={cvdData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="t" tick={false} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#4a6080', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={fmtK} width={40} />
          <Tooltip content={<Tip />} />
          <ReferenceLine y={0} stroke="#1a2a3a" />
          <Bar dataKey="cvd" name="Delta $" radius={[2, 2, 0, 0]} isAnimationActive={false}>
            {cvdData.map((e, i) => (
              <Cell key={i} fill={e.cvd >= 0 ? '#00ff88' : '#ff3366'} opacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
