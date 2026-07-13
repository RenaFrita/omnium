'use client'

import { useEffect, useRef } from 'react'
import { Interval } from '../types'
import { intervals } from '../constants'
import { useChartStore } from '../stores/chart'
import { useOrderBookStore } from '../stores/orderbook'
import { useTradesStore } from '../stores/trades'
import { useOrderFlowStore } from '../stores/orderflow'

export const useWorker = (
  coin: string,
  interval: Interval,
  onAlert?: (alert: { dir: string; cvd: number; bookImb: number; tradeRatio: number; aggrRatio: number; coin: string; ts: number }) => void
) => {
  const workerRef = useRef<Worker | null>(null)
  const setCandles = useChartStore((state) => state.setCandles)
  const addCandle = useChartStore((state) => state.addCandle)
  const applyUpdate = useOrderBookStore((state) => state.applyUpdate)
  const addTrades = useTradesStore((state) => state.addTrades)
  const setSnapshot = useOrderFlowStore((state) => state.setSnapshot)

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
      const { type, candle, history, interval: i, bids, asks, trades } = e.data

      switch (type) {
        case 'CANDLE_UPDATE':
          addCandle(candle.i as Interval, candle)
          break
        case 'HISTORY_DATA':
          setCandles(i as Interval, history)
          break
        case 'ORDER_BOOK':
          applyUpdate(bids, asks)
          break
        case 'AGGRESSIVE_TRADES':
          addTrades(trades)
          break
        case 'ORDER_FLOW_SNAP':
          setSnapshot(e.data)
          break
        case 'ALERT':
          onAlert?.(e.data)
          break
      }
    }

    return () => {
      worker.terminate()
    }
  }, [coin, onAlert, addCandle, setCandles, applyUpdate, addTrades, setSnapshot])

  useEffect(() => {
    workerRef.current?.postMessage({ type: 'FETCH_HISTORY', interval })
  }, [interval])

  const sendToWorker = (msg: Record<string, unknown>) => {
    workerRef.current?.postMessage(msg)
  }

  const requestHistory = (i: Interval) => {
    sendToWorker({ type: 'GET_HISTORY', interval: i })
  }

  return { requestHistory, sendToWorker }
}
