'use client'

import { useState, useCallback } from 'react'
import { Interval } from '../types'
import { useWorker } from '../hooks/useWorker'
import { AlertSection } from './dashboard/AlertSection'
import { BboCard } from './dashboard/BboCard'
import { AggressorCard } from './dashboard/AggressorCard'
import { BookImbalanceCard } from './dashboard/BookImbalanceCard'
import { CvdChart } from './dashboard/CvdChart'
import { TradeImbalance } from './dashboard/TradeImbalance'
import { BookPressure } from './dashboard/BookPressure'
import { VolumeDelta } from './dashboard/VolumeDelta'
import { LargePrints } from './dashboard/LargePrints'

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
  coin: string
  interval: Interval
}

export const Dashboard = ({ coin, interval }: Readonly<Props>) => {
  const [alertHistory, setAlertHistory] = useState<AlertData[]>([])
  const [activeAlert, setActiveAlert] = useState<AlertData | null>(null)

  const onAlert = useCallback((alert: AlertData) => {
    setActiveAlert(alert)
    setAlertHistory((prev) => [alert, ...prev].slice(0, 50))
  }, [])

  const { sendToWorker } = useWorker(coin, interval, onAlert)

  return (
    <div className="h-full overflow-y-auto bg-[#0a0e1a] text-[#c8d6e8] p-3 space-y-2.5 font-sans text-xs">
      <AlertSection
        activeAlert={activeAlert}
        setActiveAlert={setActiveAlert}
        alertHistory={alertHistory}
      />

      <div className="grid grid-cols-3 gap-2.5">
        <BboCard />
        <AggressorCard />
        <BookImbalanceCard />
      </div>

      <CvdChart />

      <div className="grid grid-cols-2 gap-2.5">
        <TradeImbalance />
        <BookPressure />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <VolumeDelta />
        <LargePrints sendToWorker={sendToWorker} />
      </div>

      <div className="text-center text-[9px] text-slate-800 tracking-wider mt-2">
        Hyperliquid {'\u00b7'} Worker thread {'\u00b7'} 2Hz render
      </div>
    </div>
  )
}
