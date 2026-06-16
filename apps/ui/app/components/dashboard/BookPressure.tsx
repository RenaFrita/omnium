'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useOrderFlowStore } from '../../stores/orderflow'
import { Tip } from './utils'

export const BookPressure = () => {
  const pressureData = useOrderFlowStore((s) => s.pressureData)

  return (
    <div className="bg-[#0d1526] border border-slate-800 rounded-md px-3 py-2.5">
      <div className="text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-2">Book Pressure</div>
      <ResponsiveContainer width="100%" height={65}>
        <LineChart data={pressureData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="t" tick={false} axisLine={false} tickLine={false} />
          <YAxis domain={[-100, 100]} tick={false} axisLine={false} tickLine={false} />
          <Tooltip content={<Tip />} />
          <ReferenceLine y={0} stroke="#1a2a3a" />
          <Line type="monotone" dataKey="imbalance" stroke="#00d4ff" strokeWidth={1.5} dot={false} name="%" isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
