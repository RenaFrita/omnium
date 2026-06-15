'use client'

import { useEffect, useRef } from 'react'
import { Interval } from '../types'
import { intervals } from '../constants'
import { useChartStore } from '../stores/chart'
import { useOrderBookStore } from '../stores/orderbook'
import { useTradesStore } from '../stores/trades'

export const useWorker = (coin: string) => {
  const workerRef = useRef<Worker | null>(null)
  const setCandles = useChartStore((state) => state.setCandles)
  const addCandle = useChartStore((state) => state.addCandle)
  const applyUpdate = useOrderBookStore((state) => state.applyUpdate)
  const addTrades = useTradesStore((state) => state.addTrades)

  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/engine.ts', import.meta.url)
    )
    workerRef.current = worker

    worker.postMessage({
      type: 'CONNECT',
      coin,
      intervals,
    })

    worker.onmessage = (e: MessageEvent) => {
      const { type, candle, history, interval, bids, asks, trades } = e.data

      switch (type) {
        case 'CANDLE_UPDATE':
          addCandle(candle.i as Interval, candle)
          break
        case 'HISTORY_DATA':
          setCandles(interval as Interval, history)
          break
        case 'ORDER_BOOK':
          applyUpdate(bids, asks)
          break
        case 'AGGRESSIVE_TRADES':
          addTrades(trades)
          break
      }
    }

    return () => {
      worker.terminate()
    }
  }, [coin, addCandle, setCandles, applyUpdate, addTrades])

  const requestHistory = (interval: Interval) => {
    workerRef.current?.postMessage({ type: 'GET_HISTORY', interval })
  }

  return { requestHistory }
}
